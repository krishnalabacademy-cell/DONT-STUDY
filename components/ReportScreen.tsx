import React, { useMemo } from 'react';
import { Subject } from '../types';
import { SUBJECTS } from '../constants';
import { useStudyData } from '../hooks/useStudyData';

const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

const ReportScreen: React.FC = () => {
    const { studyData } = useStudyData();

    const { minutesBySubject } = studyData;

    const totalMinutes = useMemo(() => {
        return Object.values(minutesBySubject).reduce((sum, mins) => sum + mins, 0);
    }, [minutesBySubject]);

    return (
        <div className="p-4">
            <div className="bg-gray-900 p-6 rounded-lg mb-6 text-center">
                <h2 className="text-xl font-bold text-indigo-300">Total Study Time</h2>
                <p className="text-4xl font-bold mt-2">{formatDuration(totalMinutes * 60)}</p>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Subject-wise Breakdown</h3>
            <div className="space-y-4">
                {SUBJECTS.map(subject => {
                    const durationInMinutes = minutesBySubject[subject] || 0;
                    const percentage = totalMinutes > 0 ? (durationInMinutes / totalMinutes) * 100 : 0;
                    return (
                        <div key={subject}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">{subject}</span>
                                <span className="text-sm text-gray-400">{formatDuration(durationInMinutes * 60)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-4">
                                <div 
                                    className="bg-indigo-500 h-4 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="text-center mt-8 text-xs text-gray-500 font-mono">
                Made by NANA FLEX
            </div>
        </div>
    );
};

export default ReportScreen;