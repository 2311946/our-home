function nowTime(){return new Date().toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}

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