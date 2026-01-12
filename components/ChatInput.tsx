
import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, PaperClipIcon, SendIcon, PhoneIcon } from './Icon';
import useSpeechToText from '../hooks/useSpeech';

interface ChatInputProps {
  onSendMessage: (text: string, image: string | null) => void;
  isSending: boolean;
  isOffline: boolean;
  onStartVoiceCall: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending, isOffline, onStartVoiceCall }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isListening, transcript, startListening, stopListening } = useSpeechToText({ lang: 'hi-IN' });

  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  const handleSend = () => {
    if (text.trim() || image) {
      onSendMessage(text, image);
      setText('');
      setImage(null);
      setImageName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700">
        {isOffline && <p className="text-center text-xs text-yellow-400 mb-2">You are offline. Sending is disabled.</p>}
        {imageName && (
            <div className="mb-2 text-sm text-gray-300 bg-gray-700 p-2 rounded-md flex justify-between items-center">
                <span>Attached: {imageName}</span>
                <button onClick={() => { setImage(null); setImageName(''); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-400 font-bold text-lg">×</button>
            </div>
        )}
      <div className="flex items-center space-x-2">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
        />
        <button onClick={() => fileInputRef.current?.click()} disabled={isOffline} className="p-2 text-gray-300 hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-700 disabled:opacity-50">
          <PaperClipIcon className="w-6 h-6" />
        </button>
        <button onClick={toggleListening} disabled={isOffline} className={`p-2 text-gray-300 hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-700 disabled:opacity-50 ${isListening ? 'bg-red-600 text-white animate-pulse' : ''}`}>
          <MicrophoneIcon className="w-6 h-6" />
        </button>
        <button onClick={onStartVoiceCall} disabled={isOffline} className="p-2 text-gray-300 hover:text-green-400 transition-colors rounded-full hover:bg-gray-700 disabled:opacity-50">
            <PhoneIcon className="w-6 h-6" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Aapka sawaal..."
          className="flex-1 px-4 py-2 bg-gray-700 border-2 border-transparent rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-gray-600 focus:border-indigo-500 resize-none text-white placeholder-gray-400 disabled:opacity-50"
          rows={1}
          disabled={isSending || isOffline}
        />
        <button onClick={handleSend} disabled={isSending || isOffline || (!text.trim() && !image)} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;