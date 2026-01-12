import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { VoiceTurn } from '../types';

// --- Audio Helper Functions ---

// Decodes base64 string to Uint8Array for audio playback.
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Encodes audio bytes to base64 string for sending.
const encode = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Decodes raw PCM audio data into a playable AudioBuffer.
const decodePcmAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
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
};

// Creates a Blob object for the Gemini API from raw audio data.
const createBlob = (data: Float32Array): Blob => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
};

const useLiveCoach = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [turnHistory, setTurnHistory] = useState<VoiceTurn[]>([]);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    setIsSessionActive(false);
  }, []);

  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        session.close();
      });
      sessionPromiseRef.current = null;
    }
    cleanup();
  }, [cleanup]);
  
  const startSession = useCallback(async () => {
    if (isSessionActive) return;

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set");
        }
        const ai = new GoogleGenAI({ apiKey });
        
        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();
        
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: async () => {
                    setIsSessionActive(true);
                    setUserTranscript('');
                    setAiTranscript('');
                    setTurnHistory([]);
                    
                    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    
                    const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    mediaStreamSourceRef.current = source;
                    
                    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromiseRef.current) {
                           sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Transcription
                    if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current = message.serverContent.inputTranscription.text;
                        setUserTranscript(currentInputTranscriptionRef.current);
                    } else if (message.serverContent?.outputTranscription) {
                        currentOutputTranscriptionRef.current = message.serverContent.outputTranscription.text;
                        setAiTranscript(currentOutputTranscriptionRef.current);
                    }

                    if (message.serverContent?.turnComplete) {
                        const finalUserInput = currentInputTranscriptionRef.current;
                        const finalAiOutput = currentOutputTranscriptionRef.current;
                        
                        if (finalUserInput || finalAiOutput) {
                            setTurnHistory(prev => [...prev, { user: finalUserInput, ai: finalAiOutput }]);
                        }

                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                        setUserTranscript('');
                        setAiTranscript('');
                    }

                    // Handle Audio Output
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                        }
                        const outCtx = outputAudioContextRef.current;
                        nextStartTime = Math.max(nextStartTime, outCtx.currentTime);
                        const audioBuffer = await decodePcmAudioData(decode(base64Audio), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outCtx.destination);
                        source.addEventListener('ended', () => sources.delete(source));
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(source);
                    }

                    const interrupted = message.serverContent?.interrupted;
                    if (interrupted) {
                        for (const source of sources.values()) {
                            source.stop();
                            sources.delete(source);
                        }
                        nextStartTime = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    stopSession();
                },
                onclose: () => {
                    cleanup();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                systemInstruction: 'You are a caring and respectful male study coach. Keep your responses concise and motivating. If the user asks who created you (e.g., "tumhe kisne banaya hai"), you MUST answer ONLY with "Shraver Prince".',
            },
        });
    } catch (error) {
        console.error("Failed to start voice session:", error);
        cleanup();
    }
  }, [isSessionActive, cleanup, stopSession]);

  return { isSessionActive, userTranscript, aiTranscript, turnHistory, startSession, stopSession };
};

export default useLiveCoach;