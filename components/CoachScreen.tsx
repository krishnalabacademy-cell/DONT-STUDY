
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Sender, VoiceTurn } from '../types';
import Message from './Message';
import ChatInput from './ChatInput';
import { getAiCoachResponse } from '../services/geminiService';
import { AcademicCapIcon, PhoneIcon } from './Icon';
import Spinner from './Spinner';
import useOnlineStatus from '../hooks/useOnlineStatus';
import OfflineMessage from './OfflineMessage';
import useLiveCoach from '../hooks/useLiveCoach';

const VoiceChatInterface: React.FC<{
    isSessionActive: boolean;
    userTranscript: string;
    aiTranscript: string;
    turnHistory: VoiceTurn[];
    startSession: () => void;
    stopSession: () => void;
}> = ({ isSessionActive, userTranscript, aiTranscript, turnHistory, startSession, stopSession }) => {
    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [turnHistory, userTranscript, aiTranscript]);

    return (
        <div className="flex flex-col h-full items-center justify-between p-4">
            <div className="w-full overflow-y-auto flex-1 mb-4">
                {turnHistory.map((turn, index) => (
                    <div key={index} className="mb-4">
                        <p className="text-indigo-300 font-semibold">You: <span className="text-gray-200 font-normal">{turn.user}</span></p>
                        <p className="text-pink-400 font-semibold">Coach: <span className="text-gray-200 font-normal">{turn.ai}</span></p>
                    </div>
                ))}
                {isSessionActive && (
                    <div>
                        {userTranscript && <p className="text-indigo-300 font-semibold">You: <span className="text-gray-200 font-normal">{userTranscript}</span></p>}
                        {aiTranscript && <p className="text-pink-400 font-semibold">Coach: <span className="text-gray-200 font-normal">{aiTranscript}</span></p>}
                    </div>
                )}
                 <div ref={historyEndRef} />
            </div>

            <button
                onClick={isSessionActive ? stopSession : startSession}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isSessionActive ? 'bg-red-600 hover:bg-red-500 shadow-lg scale-110' : 'bg-green-600 hover:bg-green-500'}`}
            >
                <PhoneIcon className="w-12 h-12 text-white" />
                {isSessionActive && <div className="absolute inset-0 rounded-full border-4 border-white animate-pulse"></div>}
            </button>
            <p className="mt-4 text-sm text-gray-400">{isSessionActive ? "Tap to end call" : "Tap to start voice call"}</p>
        </div>
    );
};

const CoachScreen: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const isOnline = useOnlineStatus();
    const [isVoiceMode, setIsVoiceMode] = useState(false);

    const { 
        isSessionActive, 
        userTranscript, 
        aiTranscript, 
        turnHistory, 
        startSession, 
        stopSession 
    } = useLiveCoach();

    useEffect(() => {
        const getInitialMessage = () => {
            const now = new Date().getTime();
            const lastGreetingStr = localStorage.getItem('lastGreetingTimestamp');
            const oneDay = 24 * 60 * 60 * 1000;

            if (lastGreetingStr) {
                const lastGreetingTime = parseInt(lastGreetingStr, 10);
                if (now - lastGreetingTime < oneDay) {
                    return "Aapka swagat hai. Main aapki kaise sahayata kar sakti hoon?";
                }
            }
            
            localStorage.setItem('lastGreetingTimestamp', now.toString());
            return "Radhe Radhe Ji 🙏. Main aapki AI study coach hoon. Aap text se, voice-to-text (🎤 icon), ya live voice call (📞 icon) se baat kar sakte hain.";
        };

        setMessages([
            {
                id: Date.now(),
                text: getInitialMessage(),
                sender: Sender.AI,
            },
        ]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);
    
    useEffect(() => {
        // If voice session is stopped, switch back to text mode
        if (!isSessionActive && isVoiceMode) {
            setIsVoiceMode(false);
        }
    }, [isSessionActive, isVoiceMode]);


    const handleSendMessage = useCallback(async (text: string, image: string | null = null) => {
        if (!text && !image) return;

        const userMessage: ChatMessage = {
            id: Date.now(),
            text,
            sender: Sender.User,
            image,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsSending(true);

        try {
            const aiText = await getAiCoachResponse(text, image);
            const aiMessage: ChatMessage = {
                id: Date.now() + 1,
                text: aiText,
                sender: Sender.AI,
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error getting AI response:", error);
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                text: "Radhe Radhe Ji 🙏. Ek takneeki samasya aa gayi hai. Kripya thodi der baad firse prayas karein.",
                sender: Sender.AI,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    }, []);
    
    const handleVoiceStart = () => {
        setIsVoiceMode(true);
        startSession();
    }

    return (
        <div className="flex flex-col h-full bg-gray-800">
            {isOnline ? (
                isVoiceMode || isSessionActive ? (
                    <VoiceChatInterface 
                        isSessionActive={isSessionActive}
                        userTranscript={userTranscript}
                        aiTranscript={aiTranscript}
                        turnHistory={turnHistory}
                        startSession={handleVoiceStart}
                        stopSession={stopSession}
                    />
                ) : (
                    <>
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                            {messages.map(msg => <Message key={msg.id} message={msg} />)}
                            {isSending && (
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white">
                                        <AcademicCapIcon className="w-6 h-6" />
                                    </div>
                                    <div className="bg-gray-700 rounded-lg p-3 max-w-xs md:max-w-md">
                                        <div className="flex items-center space-x-2">
                                            <Spinner />
                                            <p className="text-sm text-gray-300">Soch raha hai...</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </main>
                        <ChatInput onSendMessage={handleSendMessage} isSending={isSending} isOffline={!isOnline} onStartVoiceCall={handleVoiceStart} />
                    </>
                )
            ) : (
                <main className="flex-1 p-4">
                    <OfflineMessage message="You are offline. Please connect to the internet to chat with your AI Coach." />
                </main>
            )}
        </div>
    );
};

export default CoachScreen;