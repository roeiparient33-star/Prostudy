import { useState } from 'react';
import { Play, Square } from 'lucide-react';
import { useTimer, formatTime } from '../contexts/TimerContext';
import { useData } from '../contexts/DataContext';

export default function MobileTimerBar() {
  const { isRunning, currentSeconds, start, stop } = useTimer();
  const { courses } = useData();
  const [studyCourseId, setStudyCourseId] = useState('');

  const studyCourse = courses.find(c => String(c.id) === String(studyCourseId));

  function handleStart() {
    start(studyCourse?.name || '');
  }

  return (
    <div className={`mobile-timer-bar${isRunning ? ' running' : ''}`}>
      {/* Course selector — only when stopped */}
      {!isRunning && courses.length > 0 && (
        <select
          className="mobile-timer-course"
          value={studyCourseId}
          onChange={e => setStudyCourseId(e.target.value)}
        >
          <option value="">קורס...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
          ))}
        </select>
      )}

      {/* Course pill — when running */}
      {isRunning && studyCourse && (
        <span className="mobile-timer-course-pill">
          {studyCourse.emoji} {studyCourse.name}
        </span>
      )}

      {/* Time display */}
      <span className="mobile-timer-time">{formatTime(currentSeconds)}</span>

      {/* Start / Stop */}
      <button
        className={`mobile-timer-btn${isRunning ? ' stop' : ' start'}`}
        onClick={isRunning ? stop : handleStart}
      >
        {isRunning
          ? <><Square size={11} fill="currentColor"/> עצור</>
          : <><Play  size={11} fill="currentColor"/> התחל</>
        }
      </button>
    </div>
  );
}
