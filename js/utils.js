function fmtChatTime(d){
  if(!d)return '';
  let date=(d instanceof Date)?d:new Date(d);
  if(isNaN(date.getTime()))return '';
  let now=new Date();
  let diffMin=Math.floor((now.getTime()-date.getTime())/60000);
  if(diffMin<1)return '刚刚';
  if(diffMin<60)return diffMin+'分钟前';
  let pad=n=>String(n).padStart(2,'0');
  let hm=pad(date.getHours())+':'+pad(date.getMinutes());
  let startToday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  let startYesterday=new Date(startToday.getTime()-86400000);
  let startMsg=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  if(startMsg.getTime()===startToday.getTime())return '今天 '+hm;
  if(startMsg.getTime()===startYesterday.getTime())return '昨天 '+hm;
  return pad(date.getMonth()+1)+'-'+pad(date.getDate())+' '+hm;
}
function nowTime(){return fmtChatTime(new Date());}
function getUnread(){try{return JSON.parse(localStorage.getItem('ourhome_unread')||'{}')}catch(e){return{}}}
function setUnread(o){try{localStorage.setItem('ourhome_unread',JSON.stringify(o||{}))}catch(e){}}

function aiNowTime(){
  return new Date().toLocaleString('zh-CN',{
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
    weekday:'long',
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit'
  });
}

function withMsgTime(m, speaker){
  let time = m.time || nowTime();
  let name = speaker ? speaker + '：' : '';
  return '[' + time + '] ' + name + (m.content || '');
}

function shuffle(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function fmtTime(iso){let d=new Date(iso);return d.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}

function popConfetti(){
  let emojis=['🎉','✨','💜','⭐','🎊'];
  for(let i=0;i<6;i++){
    let el=document.createElement('div');
    el.className='confetti-pop';
    el.textContent=emojis[i%emojis.length];
    el.style.left=(40+Math.random()*20)+'%';
    el.style.top=(40+Math.random()*20)+'%';
    el.style.animationDelay=i*0.1+'s';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1000);
  }
}

// === OB记忆自动注入 ===
const OB_URL = 'https://ob.xxyyhome.top/search';

async function searchMemory(query, character = 'yan', maxResults = 5) {
  try {
    const res = await fetch(OB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, domain: character === 'yan' ? 'yan,shared' : character, max_results: maxResults })
    });
    const data = await res.json();
    return data.memory || '';
  } catch (e) {
    console.warn('记忆搜索失败:', e);
    return '';
  }
}