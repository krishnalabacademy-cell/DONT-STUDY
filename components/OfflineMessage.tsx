
import React from 'react';
import { WifiOffIcon } from './Icon';

interface OfflineMessageProps {
    message: string;
    className?: string;
}

const OfflineMessage: React.FC<OfflineMessageProps> = ({ message, className = '' }) => {
    return (
        <div className={`p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-center flex flex-col items-center justify-center gap-2 ${className}`}>
            <WifiOffIcon className="w-8 h-8 text-yellow-400" />
            <p className="text-yellow-300 font-semibold">{message}</p>
        </div>
    );
};

export default OfflineMessage;
