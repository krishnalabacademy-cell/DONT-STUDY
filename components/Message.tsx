
import React from 'react';
import { ChatMessage, Sender } from '../types';
import { AcademicCapIcon } from './Icon';

interface MessageProps {
  message: ChatMessage;
}

// Simple markdown to HTML renderer
const renderMarkdown = (text: string) => {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-sm rounded px-1 py-0.5 text-gray-200">$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-white p-3 rounded-md overflow-x-auto text-sm my-2"><code>$1</code></pre>')
        .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>');

    if (html.includes('<li')) {
      html = `<ul class="list-disc list-inside space-y-1">${html}</ul>`;
    }

    return { __html: html };
};

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isUser ? 'bg-indigo-500' : 'bg-pink-500'}`}>
        {isUser ? 'Aap' : <AcademicCapIcon className="w-6 h-6"/>}
      </div>
      <div className={`p-3 rounded-2xl shadow-md max-w-xs md:max-w-md lg:max-w-lg break-words ${isUser ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-100'}`}>
        {message.image && <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-h-60 w-full object-cover" />}
        {message.text && (
            <div className="prose prose-sm max-w-none prose-invert prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-300" dangerouslySetInnerHTML={renderMarkdown(message.text)} />
        )}
      </div>
    </div>
  );
};

export default Message;
