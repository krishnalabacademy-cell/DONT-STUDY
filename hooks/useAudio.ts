import { useLocalStorage } from './useLocalStorage';
import useOnlineStatus from './useOnlineStatus';
import { audioClips } from '../audio/sounds';
import { generateSpeech } from '../services/geminiService';

let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// For existing MP3 files
const base64ToArrayBuffer = (dataURI: string) => {
    const prefix = 'base64,';
    const index = dataURI.indexOf(prefix);
    
    if (index === -1) {
        console.error('Invalid data URI: "base64," marker not found.', dataURI);
        return new ArrayBuffer(0);
    }
    
    const base64 = dataURI.substring(index + prefix.length);
    
    // FIX: Sanitize the base64 string to remove any characters that are not part
    // of the base64 character set. This robustly prevents `atob` from failing
    // due to whitespace or other non-base64 characters in the data URI.
    const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');

    try {
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (e) {
        console.error("Failed to execute 'atob' on the sanitized string. Error:", e);
        console.error("Sanitized string (first 50 chars):", cleanBase64.substring(0, 50));
        return new ArrayBuffer(0); // Return empty buffer to prevent crash
    }
};

const playAudio = async (base64: string) => {
  try {
    const context = getAudioContext();
    const arrayBuffer = base64ToArrayBuffer(base64);
    if (arrayBuffer.byteLength === 0) return; // Don't play empty audio
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start();
  } catch (error) {
    console.error("Failed to play audio:", error);
  }
};

// --- New functions for raw PCM TTS audio ---

// Decodes base64 string to Uint8Array.
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer.
async function decodePcmAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const playGeneratedAudio = async (base64: string) => {
    if (!base64) return;
    try {
        const context = getAudioContext();
        const decodedBytes = decode(base64);
        // Gemini TTS provides audio at 24000 sample rate, mono channel
        const audioBuffer = await decodePcmAudioData(decodedBytes, context, 24000, 1);
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        source.start();
    } catch (error) {
        console.error("Failed to play generated audio:", error);
    }
};


export const useAudio = () => {
  const [persistentAudioCache, setPersistentAudioCache] = useLocalStorage<Record<string, string>>('audio-cache', {});
  const isOnline = useOnlineStatus();

  const playTextAsSpeech = async (text: string) => {
      try {
          if (persistentAudioCache[text]) {
              await playGeneratedAudio(persistentAudioCache[text]);
              return;
          }
          
          if (isOnline) {
            const audioB64 = await generateSpeech(text);
            if (audioB64) {
                const newCache = { ...persistentAudioCache, [text]: audioB64 };
                setPersistentAudioCache(newCache);
                await playGeneratedAudio(audioB64);
            }
          }
          // If offline and not in cache, silently fail. The app's core function is not interrupted.
      } catch (error) {
          console.error("Failed to play text as speech:", error);
      }
  };

  return {
    playFocusStart: () => playAudio(audioClips.start),
    playFocusReward: () => playAudio(audioClips.reward),
    playFocusScold: () => playAudio(audioClips.scold),
    playNeutral: () => playAudio(audioClips.neutral),
    playReminder: () => playAudio(audioClips.reminder),
  };
};
