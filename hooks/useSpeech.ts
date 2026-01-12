
import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add types for the Web Speech API to resolve TypeScript errors as they are not standard.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
  onerror: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
  onend: (this: SpeechRecognition, ev: Event) => any;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Extend the window object to include vendor-prefixed SpeechRecognition APIs
interface IWindow extends Window {
  SpeechRecognition: SpeechRecognitionStatic;
  webkitSpeechRecognition: SpeechRecognitionStatic;
}

interface SpeechToTextOptions {
    lang?: string;
}

interface SpeechToText {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

const useSpeechToText = (options: SpeechToTextOptions = {}): SpeechToText => {
  const { lang = 'en-US' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // FIX: Property 'isFirst' does not exist on type 'SpeechRecognitionResult'.
      // The logic has been updated to correctly process the speech recognition results
      // by mapping over all results and joining the transcripts. This provides a continuous
      // stream of text, including interim results.
      const fullTranscript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if(recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening };
};

export default useSpeechToText;