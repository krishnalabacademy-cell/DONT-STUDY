import React, { useState, useEffect, useRef } from 'react';
import { Subject } from '../types';
import { SUBJECTS } from '../constants';
import { useStudyData } from '../hooks/useStudyData';
import { useAudio } from '../hooks/useAudio';
import { PlayIcon, StopIcon, BellIcon } from './Icon';
import ReminderModal from './ReminderModal';
import Toast from './Toast';

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const FocusScreen: React.FC = () => {
  const [isStudying, setIsStudying] = useState(false);
  const [time, setTime] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Maths');
  const timerRef = useRef<number | null>(null);
  
  const { studyData, saveSession } = useStudyData();
  const audio = useAudio();

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = () => {
    setIsStudying(true);
    audio.playFocusStart();
    timerRef.current = window.setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
  };

  const handleStop = () => {
    setIsStudying(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    
    const sessionMinutes = time / 60;

    if (sessionMinutes >= 30) {
        audio.playFocusReward();
        saveSession(selectedSubject, time);
        setToastMessage('Great session! Progress saved. ✨');
    } else if (time > 0) {
        audio.playFocusScold();
        setToastMessage('Try to focus for at least 30 minutes next time!');
    } else {
        audio.playNeutral();
    }
    
    setTime(0);
  };

  return (
    <>
      <div className={`p-4 h-full flex flex-col justify-around items-center bg-gray-800 text-white transition-all duration-500`}>
        
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-300">
                {isStudying ? (
                    <span className="animate-pulse">FOCUS CHALU HAI...</span>
                ) : (
                    "PADHNE BAITHO"
                )}
            </h2>
        </div>
        
        <div className={`w-64 h-64 rounded-full flex items-center justify-center bg-gray-900 shadow-2xl my-4 transition-all duration-300 ${isStudying ? 'border-8 border-indigo-600 shadow-indigo-500/40 animate-pulse' : 'border-8 border-gray-700'}`}>
          <p className="text-5xl font-mono tracking-widest">{formatTime(time)}</p>
        </div>

        <div className="w-full max-w-xs flex flex-col items-center space-y-4">
            {!isStudying ? (
                <>
                    <div className="w-full">
                        <label htmlFor="subject-select" className="text-center block mb-2 text-gray-400">Kya padhna hai?</label>
                        <select 
                            id="subject-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                            className="bg-gray-700 text-white text-lg font-semibold p-3 rounded-lg border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        >
                            {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                    </div>

                    <button
                      onClick={handleStart}
                      className="w-full flex items-center justify-center gap-2 py-4 text-2xl font-bold rounded-lg transition-transform transform hover:scale-105 bg-indigo-600 hover:bg-indigo-500 shadow-lg hover:shadow-indigo-500/50"
                    >
                        <PlayIcon className="w-6 h-6"/>
                        Chalu Karein
                    </button>
                    <button
                        onClick={() => setShowReminderModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-md font-semibold rounded-lg bg-gray-600 hover:bg-gray-500"
                    >
                        <BellIcon className="w-5 h-5"/>
                        REMINDER LAGAO
                    </button>
                </>
            ) : (
                <button
                  onClick={handleStop}
                  className="w-full flex items-center justify-center gap-2 py-4 text-2xl font-bold rounded-lg transition-transform transform hover:scale-105 bg-red-600 hover:bg-red-500 shadow-lg hover:shadow-red-500/50"
                >
                    <StopIcon className="w-6 h-6" />
                    Bas, ho gaya?
                </button>
            )}
        </div>
        <div className="text-center mt-6">
            <p className="text-5xl font-bold text-indigo-400">{studyData.streak} 🔥</p>
            <p className="text-gray-400 mt-1">Day Streak</p>
        </div>
      </div>
      
      {showReminderModal && (
          <ReminderModal 
              onClose={() => setShowReminderModal(false)} 
              onSetReminder={() => setToastMessage('Reminder set successfully!')} 
          />
      )}
      
      <Toast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </>
  );
};

export default FocusScreen;