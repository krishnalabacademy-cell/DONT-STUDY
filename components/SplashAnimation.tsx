import React from 'react';
import { BookOpenIcon, SparklesIcon, BrainIcon } from './Icon';

interface FloatingElementProps {
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  text?: string;
  emoji?: string;
  className?: string;
  style?: React.CSSProperties;
}

const FloatingElement: React.FC<FloatingElementProps> = ({ icon: Icon, text, emoji, className = '', style }) => {
  return (
    <div className={`absolute pointer-events-none text-2xl opacity-0 ${className}`} style={style}>
      {Icon && <Icon className="w-8 h-8 text-indigo-400 dark:text-indigo-300" />}
      {text && <span className="font-bold text-gray-700 dark:text-gray-200">{text}</span>}
      {emoji && <span>{emoji}</span>}
    </div>
  );
};

const SplashAnimation: React.FC = () => {
  const elements = [
    // Math/Science in English
    { text: "H₂O", className: "animate-float-fade-1", style: { top: '10%', left: '15%', animationDelay: '0.5s', fontSize: '1.8rem' } },
    { text: "E=mc²", className: "animate-float-fade-2", style: { top: '30%', left: '5%', animationDelay: '1.5s', fontSize: '2rem' } },
    { text: "Algebra", className: "animate-float-fade-3", style: { top: '50%', left: '25%', animationDelay: '2.5s', fontSize: '1.7rem' } },
    { text: "Biology", className: "animate-float-fade-1", style: { top: '70%', left: '10%', animationDelay: '3.5s', fontSize: '2.2rem' } },
    { text: "Chemistry", className: "animate-float-fade-2", style: { top: '35%', left: '15%', animationDelay: '1.8s', fontSize: '2rem' } },
    { text: "Physics", className: "animate-float-fade-3", style: { top: '55%', right: '15%', animationDelay: '2.8s', fontSize: '2.1rem' } },
    { text: "Geometry", className: "animate-float-fade-1", style: { top: '15%', right: '30%', animationDelay: '0.9s', fontSize: '2rem' } },

    // Social Studies (SST) in Hindi
    { text: "ताजमहल", className: "animate-float-fade-2", style: { top: '20%', right: '10%', animationDelay: '1s', fontSize: '2.5rem' } },
    { emoji: "🇮🇳", className: "animate-float-fade-3", style: { top: '40%', right: '20%', animationDelay: '2s', fontSize: '3rem' } },
    { text: "महात्मा गांधी", className: "animate-float-fade-1", style: { top: '60%', right: '5%', animationDelay: '3s', fontSize: '2.8rem' } },
    { text: "संविधान", className: "animate-float-fade-2", style: { top: '45%', left: '50%', animationDelay: '1.3s', fontSize: '2.6rem' } },
    { emoji: "🌍", className: "animate-float-fade-3", style: { top: '65%', left: '5%', animationDelay: '2.7s', fontSize: '2.7rem' } },
    { emoji: "🛕", className: "animate-float-fade-1", style: { top: '25%', left: '70%', animationDelay: '2.2s', fontSize: '2rem' } }, // Temple emoji for history/culture

    // General Learning & App-related Icons
    { icon: BookOpenIcon, className: "animate-float-fade-3", style: { top: '75%', left: '40%', animationDelay: '1.2s', width: '2.5rem', height: '2.5rem' } },
    { icon: SparklesIcon, className: "animate-float-fade-1", style: { top: '25%', left: '70%', animationDelay: '2.2s', width: '2rem', height: '2rem' } },
    { emoji: "📝", className: "animate-float-fade-2", style: { top: '10%', right: '40%', animationDelay: '1.9s', fontSize: '2rem' } }, // Notes emoji
    { emoji: "💡", className: "animate-float-fade-3", style: { top: '85%', left: '60%', animationDelay: '3.2s', fontSize: '2.4rem' } },
    { emoji: "✏️", className: "animate-float-fade-1", style: { top: '70%', right: '35%', animationDelay: '1.7s', fontSize: '2.3rem' } },
    { emoji: "🎯", className: "animate-float-fade-2", style: { top: '5%', left: '5%', animationDelay: '0.8s', fontSize: '2.1rem' } }, // Target emoji for goals
    { emoji: "✨", className: "animate-float-fade-3", style: { top: '80%', left: '20%', animationDelay: '2.9s', fontSize: '2.6rem' } },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-indigo-950 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10 dark:opacity-5 dark:invert"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        <BrainIcon 
          className="w-24 h-24 md:w-32 md:h-32 text-indigo-600 dark:text-indigo-400 mb-6 drop-shadow-lg animate-fade-in-bounce"
          style={{ animationDelay: '0.2s' }} 
        />
        <h1 
          className="text-5xl md:text-7xl font-extrabold text-indigo-700 drop-shadow-lg animate-fade-in-bounce dark:text-white"
          style={{ animationDelay: '0.5s' }}
        >
          NAHI PADHIYEGA
        </h1>
      </div>

      {elements.map((el, index) => (
        <FloatingElement key={index} {...el} />
      ))}
    </div>
  );
};

export default SplashAnimation;