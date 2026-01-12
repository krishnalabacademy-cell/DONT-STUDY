
import { useLocalStorage } from './useLocalStorage';
import { Subject } from '../types';
import { SUBJECTS } from '../constants';

interface StudyData {
    minutesBySubject: Record<Subject, number>;
    streak: number;
    lastStudyDay: string;
}

const LOCAL_STORAGE_KEY = 'EXAM_TOPPER_STUDY_DATA';

const initialMinutes = SUBJECTS.reduce((acc, subject) => {
    acc[subject] = 0;
    return acc;
}, {} as Record<Subject, number>);

const initialData: StudyData = {
    minutesBySubject: initialMinutes,
    streak: 0,
    lastStudyDay: '',
};

export const useStudyData = () => {
    const [studyData, setStudyData] = useLocalStorage<StudyData>(LOCAL_STORAGE_KEY, initialData);

    const saveSession = (subject: Subject, durationSeconds: number) => {
        const today = new Date().toISOString().split('T')[0];
        const newMinutesBySubject = { ...studyData.minutesBySubject };
        
        // Ensure the subject exists in the record
        if (!newMinutesBySubject[subject]) {
            newMinutesBySubject[subject] = 0;
        }

        newMinutesBySubject[subject] += Math.round(durationSeconds / 60);

        let newStreak = studyData.streak;
        if (studyData.lastStudyDay !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (studyData.lastStudyDay === yesterdayStr) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }
        }
        
        setStudyData({
            minutesBySubject: newMinutesBySubject,
            streak: newStreak,
            lastStudyDay: today,
        });
    };
    
    return { studyData, saveSession };
};
