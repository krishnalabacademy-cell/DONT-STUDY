
import React, { useState, useRef } from 'react';
import { analyzeImageWithAi } from '../services/geminiService';
import { CameraIcon, PaperClipIcon, SparklesIcon } from './Icon';
import Spinner from './Spinner';
import useOnlineStatus from '../hooks/useOnlineStatus';
import OfflineMessage from './OfflineMessage';

const AnalyzeScreen: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isOnline = useOnlineStatus();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setAnalysis(''); // Clear previous analysis
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAnalyze = async () => {
        if (!image) {
            setError('Please select an image first.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await analyzeImageWithAi(image);
            setAnalysis(result);
        } catch (err) {
            setError('Failed to analyze image. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMarkdown = (text: string) => {
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-900 text-sm rounded px-1 py-0.5 text-gray-200">$1</code>')
            .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>');
        if (html.includes('<li')) {
            html = `<ul class="list-disc list-inside space-y-1">${html}</ul>`;
        }
        return { __html: html };
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
            />
            
            <div className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center flex-shrink-0">
                {!image ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <CameraIcon className="w-16 h-16 text-gray-500 mb-4" />
                        <p className="text-gray-400 mb-4">Take a photo or upload an image of your notes.</p>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors">
                            <PaperClipIcon className="w-5 h-5"/>
                            Select Image
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <img src={image} alt="Selected for analysis" className="max-h-48 rounded-md mx-auto" />
                        <button onClick={() => { setImage(null); setAnalysis(''); }} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">✕</button>
                    </div>
                )}
            </div>

            {image && (
                <button 
                    onClick={handleAnalyze} 
                    disabled={isLoading || !isOnline}
                    className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? <Spinner /> : <SparklesIcon className="w-6 h-6" />}
                    {isLoading ? 'Analyzing...' : 'Analyze Image'}
                </button>
            )}

            {!isOnline && (
                 <OfflineMessage message="An internet connection is required to analyze images." className="mt-4" />
            )}

            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            
            <div className="mt-4 flex-1 overflow-y-auto bg-gray-900 p-4 rounded-lg">
                {analysis && (
                    <div className="prose prose-invert prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300" dangerouslySetInnerHTML={renderMarkdown(analysis)} />
                )}
            </div>
        </div>
    );
};

export default AnalyzeScreen;
