import React, { useState, useEffect } from 'react';
import { generateNotificationContent } from '../services/geminiService';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { useAudio } from '../hooks/useAudio';
import { BellIcon } from './Icon';

interface ReminderModalProps {
  onClose: () => void;
  onSetReminder: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ onClose, onSetReminder }) => {
  const [reminderTime, setReminderTime] = useState('');
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const isOnline = useOnlineStatus();
  const audio = useAudio();

  useEffect(() => {
    // Set default time to 30 mins from now
    const defaultTime = new Date(Date.now() + 30 * 60 * 1000);
    const hours = defaultTime.getHours().toString().padStart(2, '0');
    const minutes = defaultTime.getMinutes().toString().padStart(2, '0');
    setReminderTime(`${hours}:${minutes}`);

    // Check notification permission status on mount
    if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleSetReminder = async () => {
    if (!reminderTime) {
      setError('Please select a time.');
      return;
    }
    setError(''); // Clear previous errors

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    if (reminderDate <= now) {
      setError('Please select a time in the future.');
      return;
    }
    
    if (!('Notification' in window)) {
        setError('Notifications are not supported in this browser.');
        return;
    }
    
    const delay = reminderDate.getTime() - now.getTime();

    // Generate content *before* asking for permission or setting the timeout.
    let title = 'Time to Study! 📖';
    let body = "Don't forget your scheduled study session. You can do it!";
    if (isOnline) {
        try {
            const content = await generateNotificationContent();
            title = content.title;
            body = content.body;
        } catch (e) {
            console.error("Failed to fetch AI notification, using fallback.", e);
        }
    }
    
    const scheduleNotification = () => {
        setTimeout(() => {
            navigator.serviceWorker.ready.then(registration => {
                const notificationOptions = {
                    body: body,
                    icon: '/logo192.png',
                    vibrate: [200, 100, 200],
                };
                registration.showNotification(title, notificationOptions as NotificationOptions);
            });
        }, delay);

        audio.playReminder();
        onSetReminder();
        onClose();
    }

    // Check current permission status
    if (permissionStatus === 'granted') {
        scheduleNotification();
    } else if (permissionStatus === 'default') {
        // Request permission
        const permission = await Notification.requestPermission();
        // Update status for the UI
        setPermissionStatus(permission);
        if (permission === 'granted') {
            scheduleNotification();
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm m-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BellIcon className="w-6 h-6 text-indigo-400" />
            Set Study Reminder
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {permissionStatus === 'denied' ? (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm p-3 rounded-lg my-4 text-center">
                <p className="font-semibold">Notifications are Blocked</p>
                <p className="text-xs mt-1">To use reminders, you must enable notifications for this site in your browser's settings.</p>
            </div>
        ) : (
            <>
                <p className="text-gray-400 mb-4">Select a time to get a notification to study.</p>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-2xl text-center"
                />
            </>
        )}
        
        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSetReminder} 
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={permissionStatus === 'denied'}
          >
            Set Reminder
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
            Reminder kaam karne ke liye, kripya is page ko background mein khula rakhein.
        </p>
      </div>
    </div>
  );
};

export default ReminderModal;