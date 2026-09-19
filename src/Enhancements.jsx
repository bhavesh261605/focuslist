import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Play, Pause, RotateCcw, Timer, SlidersHorizontal } from 'lucide-react';

const readPreference = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const writePreference = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };

export function AppearanceControls() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  const [quiet, setQuiet] = useState(() => readPreference('focuslist.quiet', 'false') === 'true');
  const [message, setMessage] = useState('');
  const panel = useRef(null);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101b18' : '#f8f9f4');
  }, [dark]);
  useEffect(() => { document.documentElement.dataset.quiet = String(quiet); }, [quiet]);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    setMessage(writePreference('focuslist.theme', next ? 'dark' : 'light') ? `${next ? 'Dark' : 'Light'} mode enabled.` : 'Theme changed for this visit. Browser storage is unavailable.');
  }
  return <div className="appearance-controls">
    <button className="theme-switch" type="button" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={toggleTheme} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}><Sun size={16}/><Moon size={16}/><span className="theme-thumb"/></button>
    <details className="preferences" ref={panel} onKeyDown={e => {if(e.key === 'Escape'){panel.current.open = false; panel.current.querySelector('summary').focus();}}}>
      <summary aria-label="Display preferences and shortcuts" title="Preferences & shortcuts"><SlidersHorizontal size={18}/></summary>
      <div className="preferences-panel"><strong>Make it comfortable.</strong><label><input type="checkbox" checked={quiet} onChange={e => {setQuiet(e.target.checked);if(!writePreference('focuslist.quiet', String(e.target.checked)))setMessage('Motion preference applies for this visit only.');}}/> Reduce animations</label><p>Your device’s reduced-motion setting is always respected.</p><hr/><span>KEYBOARD SHORTCUTS</span><dl><div><dt>New task</dt><dd><kbd>N</kbd></dd></div><div><dt>Search tasks</dt><dd><kbd>/</kbd></dd></div><div><dt>Close dialog</dt><dd><kbd>Esc</kbd></dd></div></dl></div>
    </details><span className="sr-only" role="status">{message}</span>
  </div>;
}

export function FocusTimer({taskTitle}) {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const deadline = useRef(0);
  useEffect(() => {
    if(!running) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(next);
      if(next === 0) {setRunning(false);setFinished(true);}
    };
    const timer = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {clearInterval(timer);document.removeEventListener('visibilitychange', tick);};
  }, [running]);
  function startPause() {
    if(running) {setRemaining(Math.max(0, Math.ceil((deadline.current-Date.now())/1000)));setRunning(false);}
    else {const seconds = remaining || minutes * 60;setRemaining(seconds);deadline.current = Date.now() + seconds * 1000;setFinished(false);setRunning(true);}
  }
  function reset(next = minutes) {setMinutes(next);setRemaining(next*60);setRunning(false);setFinished(false);}
  const formatted = `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
  return <section className={`focus-timer ${running ? 'timer-running' : ''}`} aria-label="Focus timer"><div className="timer-heading"><span><Timer size={16}/> A MOMENT OF FOCUS</span><span className="timer-state">{running ? 'In the zone' : finished ? 'Well done' : 'Your pace'}</span></div>
    <div className="timer-presets" role="group" aria-label="Focus duration">{[5,15,25].map(m=><button key={m} type="button" disabled={running} aria-pressed={minutes===m} onClick={()=>reset(m)}>{m} min</button>)}</div>
    <div className="timer-center"><span className="timer-digits" role="timer" aria-label={`${Math.floor(remaining/60)} minutes ${remaining%60} seconds remaining`}>{formatted}</span><div className="timer-actions"><button className="timer-play" onClick={startPause} aria-label={running?'Pause focus timer':'Start focus timer'}>{running?<Pause size={19}/>:<Play size={19}/>}</button><button className="timer-reset" onClick={()=>reset()} aria-label="Reset focus timer"><RotateCcw size={17}/></button></div></div>
    <div className="timer-track" aria-hidden="true"><span style={{transform:`scaleX(${1-remaining/(minutes*60)})`}}/></div><p role="status">{finished?'Session complete. Take a breath.':running?'One task. A little undivided attention.':taskTitle?'Ready when you are.':'Pick a task. Give it a little space.'}</p>
  </section>;
}

export function CompletionSpark({event}) {
  if(!event) return null;
  return <span key={event} className="completion-spark" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} style={{'--angle':`${i*36}deg`}}/>)}</span>;
}
