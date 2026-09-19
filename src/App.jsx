import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AppearanceControls, FocusTimer, CompletionSpark } from './Enhancements';
import { FocusQueue, FocusDesk } from './FocusStudio';
import { taskStatistics, selectTasks } from './task-utils';
import { ArrowUpRight, ArrowRight, Plus, Search, X, Check, Pencil, Trash2, Layers, Circle, CircleCheck, Flag, CornerDownLeft, Undo2, CheckCheck, ListFilter, Command, Minus, Pin } from 'lucide-react';

const KEY = 'focuslist.tasks.v1';
const priorities = ['High', 'Medium', 'Low'];
const filters = ['All', 'Active', 'Completed'];
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function readTasks() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {tasks: [], warning: ''};
    const tasks = JSON.parse(raw);
    if (!Array.isArray(tasks) || tasks.some(t => !t || typeof t.id !== 'string' || typeof t.title !== 'string' || !priorities.includes(t.priority) || typeof t.completed !== 'boolean')) throw new Error('Invalid saved data');
    return {tasks, warning: ''};
  } catch { return {tasks: [], warning: 'Your saved list could not be read. New changes may replace the saved list.'}; }
}
function Brand() { return <a className="brand" href="#" aria-label="FocusList home"><img className="brand-logo" src="/focuslist-logo.svg" alt="" width="42" height="42"/><span className="brand-wordmark">focus<span>list</span><i>.</i></span></a>; }
function PriorityBadge({priority}) { return <span className={`badge ${priority.toLowerCase()}`}><span/>{priority}</span>; }

export default function App() {
  const [initial] = useState(readTasks);
  const [tasks, setTasks] = useState(initial.tasks);
  const [warning, setWarning] = useState(initial.warning);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [celebration, setCelebration] = useState(0);
  const [focusId, setFocusId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editError, setEditError] = useState('');
  const input = useRef(null), searchInput = useRef(null), dialog = useRef(null);
  const toastTimer = useRef(null);
  const actions = useRef(null);
  const {completed, pending} = taskStatistics(tasks);
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const highPending = tasks.filter(t => !t.completed && t.priority === 'High').length;
  const visible = selectTasks(tasks, {status, priority:priorityFilter, search, sort});
  // User input cancels any in-flight entry/celebration animation immediately.
  // CSS transitions are left running so the browser can retarget them smoothly.
  useEffect(() => {
    const interrupt = () => document.getAnimations?.().forEach(animation => {
      if(typeof CSSAnimation !== 'undefined' && animation instanceof CSSAnimation) animation.cancel();
    });
    const options = {capture:true,passive:true};
    window.addEventListener('pointerdown',interrupt,options);
    window.addEventListener('scroll',interrupt,options);
    window.addEventListener('keydown',interrupt,options);
    return () => {window.removeEventListener('pointerdown',interrupt,true);window.removeEventListener('scroll',interrupt,true);window.removeEventListener('keydown',interrupt,true);};
  },[]);
  const date = new Date();
  const dateLabel = date.toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'});

  function notify(message, deleted = null) { clearTimeout(toastTimer.current); setToast({message, deleted}); toastTimer.current = setTimeout(() => setToast(null), deleted ? 12000 : 4000); }
  function persist(next) {
    setTasks(next);
    try {localStorage.setItem(KEY, JSON.stringify(next)); setWarning('');}
    catch {setWarning('Changes are available now, but this browser could not save them. Keep this tab open.');}
  }
  actions.current = {tasks, persist};
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = tool => {try {Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});} catch { /* Progressive enhancement; ordinary controls remain available. */ }};
    register({name:'list_focuslist_tasks',title:'Read FocusList tasks',description:'Read the tasks stored in this browser, optionally searching titles. Returns real task data without modifying it.',inputSchema:{type:'object',properties:{search:{type:'string'}},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input || typeof input!=='object' || (input.search!==undefined && typeof input.search!=='string') || Object.keys(input).some(k=>k!=='search'))throw new Error('Provide an optional search string.');return {tasks:actions.current.tasks.filter(t=>t.title.toLowerCase().includes((input.search||'').trim().toLowerCase()))};}});
    register({name:'create_focuslist_tasks',title:'Add tasks to FocusList',description:'Create one or more tasks in this browser’s FocusList. Saves them locally and updates the visible task list.',inputSchema:{type:'object',properties:{tasks:{type:'array',minItems:1,maxItems:50,items:{type:'object',properties:{title:{type:'string',minLength:1,maxLength:200},priority:{type:'string',enum:priorities}},required:['title','priority'],additionalProperties:false}}},required:['tasks'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input || !Array.isArray(input.tasks) || input.tasks.length<1 || input.tasks.length>50 || Object.keys(input).some(k=>k!=='tasks') || input.tasks.some(t=>!t || typeof t.title!=='string' || !t.title.trim() || t.title.length>200 || !priorities.includes(t.priority) || Object.keys(t).some(k=>!['title','priority'].includes(k))))throw new Error('Each task needs a non-empty title up to 200 characters and a High, Medium or Low priority.');const created=input.tasks.map(t=>({id:uid(),title:t.title.trim(),priority:t.priority,completed:false,createdAt:Date.now()}));flushSync(()=>{actions.current.persist([...created,...actions.current.tasks]);setStatus('All');setPriorityFilter('All');setSearch('');});return {created};}});
    return ()=>lifecycle.abort();
  },[]);
  useEffect(() => {
    const handler = e => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || e.target.isContentEditable || dialog.current?.open || e.ctrlKey || e.metaKey || e.altKey) return;
      if(e.key === '/') {e.preventDefault(); searchInput.current?.focus();}
      if(e.key.toLowerCase() === 'n') {e.preventDefault(); input.current?.focus();}
    };
    window.addEventListener('keydown',handler);
    const sync = e => {if(e.key === KEY || e.key === null) {const data=readTasks();setTasks(data.tasks);setWarning(data.warning);}};
    window.addEventListener('storage',sync);
    return () => {window.removeEventListener('keydown',handler);window.removeEventListener('storage',sync);clearTimeout(toastTimer.current);};
  },[]);
  useEffect(() => { if(editing) {dialog.current?.showModal();dialog.current?.querySelector('input')?.focus();} else dialog.current?.close(); },[editing]);
  function addTask(e) {
    e.preventDefault();
    if(!title.trim()) {setError('Give your task a title first.');input.current?.focus();return;}
    const next={id:uid(),title:title.trim(),priority,completed:false,createdAt:Date.now()};
    persist([next,...tasks]);setTitle('');setError('');
    const hidden = status==='Completed' || (priorityFilter!=='All' && priorityFilter!==priority) || (search.trim() && !next.title.toLowerCase().includes(search.trim().toLowerCase()));
    if(hidden) {setStatus('All');setPriorityFilter('All');setSearch('');}
    notify('Task added. Make it happen.');input.current?.focus();
  }
  function toggleTask(task) {if(!task.completed)setCelebration(Date.now());persist(tasks.map(t=>t.id===task.id?{...t,completed:!t.completed,focused:false}:t));notify(task.completed?'Task moved to active.':'One less thing on your mind.');}
  function pinTask(task) {
    if(!task.focused && tasks.filter(t=>t.focused&&!t.completed).length>=3) {notify('Your focus queue has three tasks. Unpin one to make room.');return;}
    persist(tasks.map(t=>t.id===task.id?{...t,focused:!t.focused}:t));notify(task.focused?'Task removed from your focus queue.':'Task added to your focus queue.');
  }
  function deleteTask(task) {persist(tasks.filter(t=>t.id!==task.id));notify('Task deleted.',{task,index:tasks.findIndex(t=>t.id===task.id)});}
  function undo() {if(!toast?.deleted)return;const next=[...tasks];if(!next.some(t=>t.id===toast.deleted.task.id))next.splice(Math.min(toast.deleted.index,next.length),0,toast.deleted.task);persist(next);notify('Task restored.');}
  function openEdit(task) {setEditTitle(task.title);setEditPriority(task.priority);setEditError('');setEditing(task);}
  function saveEdit(e) {e.preventDefault();if(!editTitle.trim()){setEditError('A task title cannot be empty.');return;}persist(tasks.map(t=>t.id===editing.id?{...t,title:editTitle.trim(),priority:editPriority}:t));setEditing(null);notify('Task updated.');}
  function resetFilters() {setStatus('All');setPriorityFilter('All');setSearch('');}
  function addSamples() {
    const sample=[['Map out the next big idea','High',false],['Make time for a little movement','Medium',false],['Finish that chapter','Low',false],['Clear a little space on your desk','Low',true]];
    persist(sample.map(([title,priority,completed],i)=>({id:uid(),title,priority,completed,createdAt:Date.now()-i})));
    notify('Sample tasks added. Edit them to make them yours.');
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to tasks</a>
    <aside className="sidebar">
      <Brand/>
      <div className="workspace-label"><span>PERSONAL SPACE</span><span className="workspace-icon">01</span></div>
      <nav aria-label="Task views" className="side-nav">
        {filters.map((f,i)=>{const Icon=[Layers,Circle,CircleCheck][i];return <button key={f} className={status===f?'selected':''} aria-pressed={status===f} onClick={()=>setStatus(f)}><Icon size={18}/><span>{f==='All'?'All tasks':f}</span><span className="nav-count">{[tasks.length,pending,completed][i]}</span></button>;})}
      </nav>
      <div className="side-divider"/>
      <p className="nav-label">PRIORITIES</p>
      <nav aria-label="Priority shortcuts" className="priority-nav">{priorities.map(p=><button key={p} className={priorityFilter===p?'chosen':''} aria-pressed={priorityFilter===p} onClick={()=>setPriorityFilter(priorityFilter===p?'All':p)}><span className={`priority-dot ${p.toLowerCase()}`}/><span>{p} priority</span><span>{tasks.filter(t=>t.priority===p).length}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="small-brand"><CheckCheck size={18}/><span>A little structure.<br/><strong>A lot more headspace.</strong></span></div><div className="local-indicator"><span/>{warning?'Storage needs attention':'Saved on this device'}</div></div>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="mobile-brand"><Brand/></div><div className="breadcrumb"><span>My workspace</span><span>/</span><strong>Daily tasks</strong></div><div className="topbar-right"><AppearanceControls/><span className="today-label">{date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span><span className="avatar" aria-label="Personal workspace"><img src="/focuslist-logo.svg" alt="" width="30" height="30"/></span></div></header>
      <main id="main" className="main-content">
        <section className="page-heading"><div><div className="eyebrow"><span/> A FRESH PERSPECTIVE, EVERY DAY</div><h1>Your day, <span>in focus.</span></h1><p>{dateLabel}<span className="heading-separator">/</span>Let’s make a little progress.</p></div><button className="round-add" aria-label="Focus new task input" onClick={()=>input.current?.focus()}><Plus size={27}/></button></section>
        <div className="content-grid"><section className="task-workspace" aria-label="Task workspace">
          <div className="stats" aria-label="Task statistics">{[['Total tasks',tasks.length,Layers],['Completed',completed,CircleCheck],['Pending',pending,Circle]].map(([label,value,Icon])=><button type="button" className="stat" key={label} title={`Show ${label.toLowerCase()}`} onClick={()=>setStatus(label==='Completed'?'Completed':label==='Pending'?'Active':'All')}><div className="stat-label"><Icon size={15}/>{label}</div><div className="stat-number" key={value}>{String(value).padStart(2,'0')}<span>{label==='Completed'?'done':label==='Pending'?'to go':'in your space'}</span></div></button>)}</div>
          <FocusQueue tasks={tasks} onUnpin={pinTask} onChoose={task=>{setFocusId(task.id);document.getElementById('focus-studio')?.focus();}}/>
          <form className={`composer ${error?'invalid':''}`} onSubmit={addTask}>
            <label className="sr-only" htmlFor="task-title">New task title</label><div className="compose-line"><Plus size={23}/><input id="task-title" ref={input} value={title} onChange={e=>{setTitle(e.target.value);setError('');}} placeholder="What’s on your mind?" maxLength={200} autoComplete="off" aria-invalid={!!error} aria-describedby={error?'task-error':undefined}/></div>
            {error&&<p id="task-error" className="field-error" role="alert">{error}</p>}
            <div className="composer-bottom"><div className="priority-picker"><Flag size={15}/><label htmlFor="new-priority">Priority</label><select id="new-priority" aria-label="Priority" value={priority} onChange={e=>setPriority(e.target.value)}>{priorities.map(p=><option key={p}>{p}</option>)}</select></div><button className="add-button" type="submit">Add task <CornerDownLeft size={16}/></button></div>
          </form>
          {warning&&<div className="warning" role="alert">{warning}</div>}
          <div className="list-heading"><h2>Your tasks <span>{tasks.length}</span></h2><div className="sort-control"><label htmlFor="task-sort">Sort</label><select id="task-sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="priority">Priority first</option><option value="title">Title A–Z</option></select></div></div>
          <div className="task-toolbar"><div className="tabs" role="group" aria-label="Filter task status">{filters.map(f=><button key={f} aria-pressed={status===f} onClick={()=>setStatus(f)} className={status===f?'active':''}>{f}</button>)}</div><div className="priority-filter"><ListFilter size={16}/><label htmlFor="priority-filter" className="sr-only">Filter by priority</label><select id="priority-filter" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option value="All">All priorities</option>{priorities.map(p=><option key={p} value={p}>{p} priority</option>)}</select></div></div>
          <div className="search-box"><Search size={18}/><label htmlFor="search" className="sr-only">Search tasks by title</label><input ref={searchInput} id="search" placeholder="Find a task…" value={search} onChange={e=>setSearch(e.target.value)}/>{search?<button aria-label="Clear search" onClick={()=>setSearch('')}><X size={16}/></button>:<kbd>/</kbd>}</div>
          <div className="active-filters" aria-label="Applied filters">{status!=='All'&&<button onClick={()=>setStatus('All')}>{status}<X size={13}/><span className="sr-only">Remove status filter</span></button>}{priorityFilter!=='All'&&<button onClick={()=>setPriorityFilter('All')}>{priorityFilter} priority<X size={13}/><span className="sr-only">Remove priority filter</span></button>}{search.trim()&&<button onClick={()=>setSearch('')}>“{search.trim()}”<X size={13}/><span className="sr-only">Remove search</span></button>}{(status!=='All'||priorityFilter!=='All'||search.trim())&&<button className="clear-filters" onClick={resetFilters}>Reset filters</button>}</div>
          <div className="task-list" aria-label="Tasks">
            {visible.map((task,i)=><article className={`task-row ${task.completed?'is-complete':''}`} key={task.id} style={{'--row-index':Math.min(i,8)}}><label className="check-control"><input type="checkbox" checked={task.completed} onChange={()=>toggleTask(task)} aria-label={`Mark ${task.title} as ${task.completed?'active':'completed'}`}/><span className="check-visual"><Check size={15}/></span></label><div className="task-body"><span className="task-title">{task.title}</span><span className="task-meta">{task.completed?'Completed':'To do'}<span>·</span><span>{new Date(task.createdAt||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span></span></div><PriorityBadge priority={task.priority}/><div className="row-actions">{!task.completed&&<button className={task.focused?'pin-button pinned':'pin-button'} aria-label={`${task.focused?'Unpin':'Pin'} ${task.title}${task.focused?' from':' to'} focus queue`} aria-pressed={!!task.focused} title={task.focused?'Remove from focus queue':'Add to focus queue'} onClick={()=>pinTask(task)}><Pin size={16}/></button>}<button aria-label={`Edit ${task.title}`} title="Edit task" onClick={()=>openEdit(task)}><Pencil size={16}/></button><button className="delete-button" aria-label={`Delete ${task.title}`} title="Delete task" onClick={()=>deleteTask(task)}><Trash2 size={16}/></button></div></article>)}
            {!visible.length&&<div className="empty-state"><div className="empty-symbol">{tasks.length?<Search size={30}/>:<CheckCheck size={34}/>}</div><h3>{tasks.length?'A little too focused?':'A clear space. A fresh start.'}</h3><p>{tasks.length?'No tasks match these filters. Give your list a little more room.':'Big plans or small reminders. Start with one thing you want to do.'}</p>{tasks.length?<button className="text-button" onClick={resetFilters}>Clear search & filters <ArrowRight size={16}/></button>:<div className="empty-actions"><button className="text-button" onClick={()=>input.current?.focus()}>Write your first task <ArrowUpRight size={16}/></button><button className="sample-button" onClick={addSamples}>Try a sample list</button></div>}</div>}
          </div>
          <footer className="list-footer"><span role="status" aria-live="polite" aria-atomic="true">{visible.length} {visible.length===1?'task':'tasks'} shown{(search||status!=='All'||priorityFilter!=='All')&&` of ${tasks.length}`}</span><span><Command size={12}/> <kbd>N</kbd> new task <span className="footer-dot">·</span><kbd>/</kbd> search</span></footer>
        </section>
        <aside className="insights" aria-label="Your progress"><FocusDesk tasks={tasks} selectedId={focusId} onSelect={setFocusId} onComplete={toggleTask} onAdd={()=>input.current?.focus()}/><section className="momentum-card"><div className="card-overline"><span>THE BIG PICTURE</span><ArrowUpRight size={20}/></div><h2>Your day, taking shape.</h2><div className="progress-dial"><CompletionSpark event={celebration}/><div className="dial-accessible" role="progressbar" aria-label="Tasks completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><svg viewBox="0 0 200 200" aria-hidden="true"><circle className="dial-ticks" cx="100" cy="100" r="96"/><circle className="dial-inner" cx="100" cy="100" r="69"/><circle className="dial-track" cx="100" cy="100" r="82"/><circle className="dial-fill" cx="100" cy="100" r="82" strokeDasharray="515.22" strokeDashoffset={515.22*(1-percent/100)}/></svg><div className="dial-value"><strong key={percent}>{percent}<span>%</span></strong><span>complete</span></div></div></div><div className="momentum-bottom"><span>{completed} of {tasks.length} tasks complete</span><span className="momentum-line"><span style={{transform:`scaleX(${percent/100})`}}/></span><p>{!tasks.length?'Every good day starts with a little intention.':pending===0?'Everything, done. Enjoy that extra headspace.':highPending?`${highPending} high-priority ${highPending===1?'task is':'tasks are'} waiting for your attention.`:'You’ve got this. Take the next small step.'}</p></div></section><div className="privacy-note"><span className="privacy-icon"><Check size={12}/></span><span>Just you and your list.<br/>Your tasks stay in this browser.</span></div></aside></div>
        <div className="page-footer"><span>FOCUSLIST <span> / </span> A LITTLE MORE INTENTIONAL.</span><span>Made for your everyday.</span></div>
      </main>
    </div>
    <dialog ref={dialog} className="edit-dialog" onCancel={()=>setEditing(null)} onClick={e=>{if(e.target===dialog.current)setEditing(null);}} aria-labelledby="edit-heading"><form onSubmit={saveEdit}><div className="dialog-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h2 id="edit-heading">A change of plan.</h2></div><button type="button" className="icon-button" aria-label="Close edit dialog" onClick={()=>setEditing(null)}><X size={20}/></button></div><label htmlFor="edit-title">Task title</label><input id="edit-title" value={editTitle} onChange={e=>{setEditTitle(e.target.value);setEditError('');}} maxLength={200} autoFocus aria-describedby={editError?'edit-error':undefined} aria-invalid={!!editError}/>{editError&&<p id="edit-error" className="field-error" role="alert">{editError}</p>}<label htmlFor="edit-priority">Priority</label><select id="edit-priority" value={editPriority} onChange={e=>setEditPriority(e.target.value)}>{priorities.map(p=><option key={p}>{p}</option>)}</select><div className="dialog-actions"><button type="button" className="secondary-button" onClick={()=>setEditing(null)}>Cancel</button><button className="add-button" type="submit">Save changes <Check size={17}/></button></div></form></dialog>
    {toast&&<div className="toast" role="status"><span className="toast-check"><Check size={16}/></span><span>{toast.message}</span>{toast.deleted&&<button onClick={undo}><Undo2 size={15}/>Undo</button>}<button className="toast-close" aria-label="Dismiss notification" onClick={()=>setToast(null)}><X size={16}/></button></div>}
  </div>;
}

