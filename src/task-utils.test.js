import test from 'node:test';
import assert from 'node:assert/strict';
import {selectTasks, taskStatistics} from './task-utils.js';
const tasks = [
  {id:'1',title:'Plan trip',priority:'Low',completed:false,createdAt:10},
  {id:'2',title:'Prepare Demo',priority:'High',completed:true,createdAt:20},
  {id:'3',title:'Plan demo',priority:'Medium',completed:false,createdAt:30},
];
test('search, status and priority combine without changing source data',()=>{
  const before=structuredClone(tasks);
  assert.deepEqual(selectTasks(tasks,{search:'  DEMO ',status:'Completed',priority:'High'}).map(t=>t.id),['2']);
  assert.equal(selectTasks(tasks,{search:'DEMO',status:'Active',priority:'High'}).length,0);
  assert.deepEqual(tasks,before);
});
test('statistics count underlying tasks, including empty and completed lists',()=>{
  assert.deepEqual(taskStatistics(tasks),{total:3,completed:1,pending:2});
  assert.deepEqual(taskStatistics([]),{total:0,completed:0,pending:0});
  assert.deepEqual(taskStatistics(tasks.map(t=>({...t,completed:true}))),{total:3,completed:3,pending:0});
});
test('all supported sorts work on filtered results and preserve source order',()=>{
  assert.deepEqual(selectTasks(tasks).map(t=>t.id),['3','2','1']);
  assert.deepEqual(selectTasks(tasks,{sort:'oldest'}).map(t=>t.id),['1','2','3']);
  assert.deepEqual(selectTasks(tasks,{sort:'priority'}).map(t=>t.id),['2','3','1']);
  assert.deepEqual(selectTasks(tasks,{sort:'title'}).map(t=>t.id),['3','1','2']);
  assert.deepEqual(selectTasks(tasks,{status:'Active',sort:'priority'}).map(t=>t.id),['3','1']);
  assert.deepEqual(tasks.map(t=>t.id),['1','2','3']);
});
test('literal markup and accented task titles are ordinary searchable text',()=>{
  assert.equal(selectTasks([{title:'<script>alert(1)</script>',priority:'Low',completed:false}],{search:'<script>'}).length,1);
  assert.equal(selectTasks([{title:'Café break',priority:'Low',completed:false}],{search:'CAFÉ'}).length,1);
});

test('focus queue puts user pins first, then priority and age; excludes completed tasks', async()=>{
  const {getFocusQueue}=await import('./task-utils.js');
  const sample=[
    {id:'a',title:'New urgent',priority:'High',completed:false,createdAt:30},
    {id:'b',title:'Pinned low',priority:'Low',completed:false,focused:true,createdAt:40},
    {id:'c',title:'Old urgent',priority:'High',completed:false,createdAt:10},
    {id:'d',title:'Done',priority:'High',completed:true,focused:true,createdAt:1}
  ];
  assert.deepEqual(getFocusQueue(sample).map(t=>t.id),['b','c','a']);
  assert.deepEqual(sample.map(t=>t.id),['a','b','c','d']);
});
