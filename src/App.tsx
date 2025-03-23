import { useState, useEffect, useRef } from "react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { createAlarmSound } from './utils/sound';
import { speakMessage } from './utils/tts';
import { loadAppState, saveAppState, Alarm } from './utils/storage';
import "./App.css";

const KEEP_FLAGS = [' keep', ' k'];
const ALARM_DELETION_DELAY = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_HISTORY = 50; // Maximum number of commands to keep in history

function App() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Request notification permission when the app starts
    const checkNotificationPermission = async () => {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
    };
    checkNotificationPermission();
  }, []);

  // Load alarms and command history on startup
  useEffect(() => {
    const initializeData = async () => {
      const data = await loadAppState();
      setAlarms(data.alarms);
      setCommandHistory(data.commandHistory);
    };
    initializeData();
  }, []);

  // Save alarms and command history whenever they change
  useEffect(() => {
    saveAppState(alarms, commandHistory);
  }, [alarms, commandHistory]);

  const parseAlarmInput = (input: string): { time: Date; duration?: number; keep: boolean, message: string } | null => {
    const now = new Date();
    
    // Check for keep flag at the end
    const keep = KEEP_FLAGS.some(flag => input.toLowerCase().endsWith(flag));
    const cleanInput = keep ? input.slice(0, -5).trim() : input;
    
    // Try to split by "in" first, if not found, treat the whole input as time
    let message = '';
    let timeString = '';
    
    const inMatch = cleanInput.match(/\s+in\s+/i);
    if (inMatch) {
      [message, timeString] = cleanInput.split(/\s+in\s+/i);
    } else {
      // If no "in" found, treat the whole input as time
      timeString = cleanInput;
    }
    
    timeString = timeString.toLowerCase();
    let totalMilliseconds = 0;
    
    // Split time components (e.g., "1d2h30m15s" -> ["1d", "2h", "30m", "15s"])
    const components = timeString.match(/\d+[dhms]/g);
    if (!components) return null;
    
    for (const component of components) {
      const value = parseInt(component.slice(0, -1));
      const unit = component.slice(-1);
      
      switch (unit) {
        case 'd':
          totalMilliseconds += value * 24 * 60 * 60 * 1000;
          break;
        case 'h':
          totalMilliseconds += value * 60 * 60 * 1000;
          break;
        case 'm':
          totalMilliseconds += value * 60 * 1000;
          break;
        case 's':
          totalMilliseconds += value * 1000;
          break;
        default:
          return null;
      }
    }
    
    if (totalMilliseconds === 0) return null;
    
    return {
      time: new Date(now.getTime() + totalMilliseconds),
      duration: totalMilliseconds,
      keep,
      message,
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add command to history first
    setCommandHistory(prev => {
      const newHistory = [input, ...prev].slice(0, MAX_HISTORY);
      return newHistory;
    });
    setHistoryIndex(-1);

    // Check for custom commands first
    const command = input.trim().toLowerCase();
    if (command === 'clear') {
      setAlarms([]);
      setInput("");
      return;
    } else if (command === 'help') {
      alert(`Available Commands:
- clear: Delete all alarms
- help: Show this help message
- f: Add a 10-minute farm alarm
- t: Add a 15-minute trade alarm

Alarm Format:
- "message in time" (e.g., "farm in 10m")
- "message in time keep" (e.g., "farm in 1h 30m keep")
- Time units: d (days), h (hours), m (minutes), s (seconds)`);
      setInput("");
      return;
    } else if (command === 'f') {
      const now = new Date();
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        message: "farm",
        time: new Date(now.getTime() + 10 * 60 * 1000),
        duration: 10 * 60 * 1000,
        keep: false,
        isActive: true,
      };
      setAlarms(prevAlarms => [...prevAlarms, newAlarm].sort((a, b) => a.time.getTime() - b.time.getTime()));
      setInput("");
      return;
    } else if (command === 't') {
      const now = new Date();
      const newAlarm: Alarm = {
        id: Date.now().toString(),
        message: "trade",
        time: new Date(now.getTime() + 15 * 60 * 1000),
        duration: 15 * 60 * 1000,
        keep: false,
        isActive: true,
      };
      setAlarms(prevAlarms => [...prevAlarms, newAlarm].sort((a, b) => a.time.getTime() - b.time.getTime()));
      setInput("");
      return;
    }

    const parsed = parseAlarmInput(input);
    if (!parsed) {
      alert("Invalid alarm format. Use: 'anything in 10m', 'anything in 1h 30m', or 'anything at 14:30'. Add 'keep' or 'k' at the end to keep the alarm after it triggers.");
      return;
    }

    // Extract message from input, removing the keep flag if present
    const cleanInput = input.replace(new RegExp(`\\s+(?:${KEEP_FLAGS.join('|')})$`, 'i'), '').trim();
    const message = cleanInput.includes(' in ') 
      ? cleanInput.split(/\s+in\s+/i)[0]
      : cleanInput;

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      message: message,
      time: parsed.time,
      duration: parsed.duration,
      keep: parsed.keep,
      isActive: true,
    };

    setAlarms(prevAlarms => [...prevAlarms, newAlarm].sort((a, b) => a.time.getTime() - b.time.getTime()));
    setInput("");
  };

  const toggleAlarm = (id: string) => {
    setAlarms(prevAlarms => 
      prevAlarms.map(alarm => {
        if (alarm.id === id) {
          if (!alarm.isActive && alarm.duration) {
            // If reactivating a duration-based alarm, calculate remaining time
            const now = new Date();
            const remainingDuration = alarm.duration - (alarm.elapsedTime || 0);
            return {
              ...alarm,
              isActive: true,
              time: new Date(now.getTime() + remainingDuration)
            };
          } else if (alarm.isActive && alarm.duration) {
            // If pausing a duration-based alarm, calculate elapsed time
            const now = new Date();
            const elapsed = now.getTime() - (alarm.time.getTime() - alarm.duration);
            return {
              ...alarm,
              isActive: false,
              elapsedTime: elapsed
            };
          }
          return { ...alarm, isActive: !alarm.isActive };
        }
        return alarm;
      })
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== id));
  };

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      setAlarms(prevAlarms => 
        prevAlarms.map(alarm => {
          if (alarm.isActive && alarm.time <= now) {
            // Trigger notification using Tauri API
            sendNotification({
              title: 'Grepolis Alarm',
              body: alarm.message
            });
            // Play alarm sound
            createAlarmSound();
            // Speak the alarm message
            speakMessage(alarm.message);
            return { ...alarm, isActive: false };
          }
          return alarm;
        }).filter(alarm => {
          // Keep alarms that are either:
          // 1. Still active
          // 2. Have the keep flag
          // 3. Are less than 5 minutes old
          if (alarm.isActive || alarm.keep) return true;
          const timeSinceTrigger = now.getTime() - alarm.time.getTime();
          return timeSinceTrigger < ALARM_DELETION_DELAY;
        })
      );
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add global Tab key handler to focus input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Only submit if the input has focus
        if (document.activeElement === inputRef.current) {
          const form = inputRef.current?.closest('form');
          form?.requestSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const formatTimeRemaining = (time: Date): string => {
    const now = new Date();
    const diff = time.getTime() - now.getTime();
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
  };

  const getTimeDisplay = (alarm: Alarm): string => {
    if (!alarm.isActive && !alarm.keep) {
      const now = new Date();
      const timeUntilDeletion = ALARM_DELETION_DELAY - (now.getTime() - alarm.time.getTime());
      if (timeUntilDeletion <= 0) return "Deleting soon...";
      return `Deleting in ${formatTimeRemaining(new Date(now.getTime() + timeUntilDeletion))}`;
    }

    if (!alarm.isActive && alarm.keep) {
      return "Keep";
    }
    
    return formatTimeRemaining(alarm.time);
  };

  return (
    <div className="app-container">
      <div className="command-history-panel">
        <div className="command-history-header">
          <h3>Command History</h3>
          <button 
            className="clear-history-button"
            onClick={() => setCommandHistory([])}
            title="Clear command history"
          >
            ×
          </button>
        </div>
        <div className="command-list">
          {commandHistory.map((cmd, index) => (
            <div 
              key={index} 
              className={`command-item ${index === historyIndex ? 'selected' : ''}`}
              onClick={() => {
                setHistoryIndex(index);
                setInput(cmd);
              }}
            >
              {cmd}
            </div>
          ))}
        </div>
      </div>
      <div className="main-content">
        <div className="alarm-list">
          {alarms.map(alarm => (
            <div key={alarm.id} className={`alarm-item ${alarm.isActive ? 'active' : 'completed'}`}>
              <div className="alarm-content">
                <span className="alarm-message">{alarm.message}</span>
                <span className={`alarm-time ${!alarm.isActive ? 'deleting' : ''}`}>
                  {getTimeDisplay(alarm)}
                </span>
              </div>
              <div className="alarm-controls">
                <button 
                  className={`control-button ${alarm.isActive ? 'active' : 'inactive'}`}
                  onClick={() => toggleAlarm(alarm.id)}
                  title={alarm.isActive ? "Pause Alarm" : "Activate Alarm"}
                >
                  {alarm.isActive ? "⏸" : "▶"}
                </button>
                <button 
                  className="control-button delete"
                  onClick={() => deleteAlarm(alarm.id)}
                  title="Delete Alarm"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="input-form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="farm in 10m, farm in 1h 30m, or farm at 14:30"
            className="alarm-input"
          />
          <button type="submit" className="submit-button">Set Alarm</button>
        </form>
      </div>
    </div>
  );
}

export default App;
