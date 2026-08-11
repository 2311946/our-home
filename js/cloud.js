function loadCloudChat(id,loadMore){
  if(chatLoading)return;
  if(!PB_URL){render();return;}
  chatLoading=true;
  let offset=chatOffset[id]||0;
  let limit=50;
  let url;
if(id==='group'){
url=PB_URL+'/api/collections/chat_messages/records?filter=(character="group"%20||%20character~"group_")&sort=msg_time&perPage=500';
  }else{
    url=PB_URL+'/api/collections/chat_messages/records?filter=(character="'+id+'")&sort=-msg_time&perPage='+limit+'&page='+(Math.floor(offset/limit)+1);
  }
    let opts=url.startsWith(PB_URL)?{}:{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}};
fetch(url,opts).then(r=>r.json()).then(raw=>{let data=raw.items||raw;    if(!data||!data.length){chatHasMore[id]=false;chatLoading=false;if(!loadMore)render();return;}
if(id==='group'){
  let nameMap={'宣宣':'user','顾言':'yan','裴寂':'peiji','裴洵':'axun','江溯':'jiangsu','溯':'su','邹峥':'zouzheng','柯柯':'keke','沈晏':'shenyan'};
  chats.group=data.map(m=>{
    if(m.character&&m.character.indexOf('group_')===0){return {role:'ai',content:m.content,character:m.character.slice(6),time:fmtTime(m.msg_time)};}
    let charId=nameMap[m.role]||m.role;
    if(charId==='user')return {role:'user',content:m.content,time:fmtTime(m.msg_time)};
    return {role:'ai',content:m.content,character:charId,time:fmtTime(m.msg_time)};
  });
  chatLoading=false;render();renderList();return;
}let msgs=data.reverse().map(m=>({role:m.role,content:m.content,thinking:m.thinking||'',time:m.msg_time?new Date(m.msg_time).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'',character:m.character}));
    if(loadMore){chats[id]=(msgs).concat(chats[id]||[]);}else{chats[id]=msgs;}
    chatOffset[id]=offset+data.length;
    chatHasMore[id]=data.length>=limit;
    chatLoading=false;
    render();
    renderList();
    if(loadMore){document.getElementById('chatBox').scrollTop=100;}
  }).catch(()=>{chatLoading=false;render();});
}

async function syncCloudChats(){
  if(!SUPA_URL||!SUPA_KEY){alert('请先配置 Supabase');return;}
  let btn=event.target;
  btn.textContent='同步中...';
  btn.disabled=true;
  try{
    // 1. 先把本地推到云端（去重）
    let uploaded=0;
    for(let charId of ['yan','peiji','shenyan']){
      let msgs=chats[charId]||[];
      if(!msgs.length)continue;
      let last5=msgs.slice(-5);
      for(let m of last5){
        if(!m.content||m.content==='连接失败')continue;
        await fetch(SUPA_URL+'/rest/v1/chat_messages',{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({character:charId,role:m.role==='ai'?'ai':'user',content:m.content})}).catch(()=>{});
        uploaded++;
      }
    }
    // 2. 再从云端拉
    await loadFromCloud();
    renderList();
    if(currentChar)render();
    btn.textContent='从云端同步聊天记录';
    btn.disabled=false;
    alert('同步完成！上传'+uploaded+'条，已拉取最新云端记录');
  }catch(e){
    btn.textContent='从云端同步聊天记录';
    btn.disabled=false;
    alert('同步失败：'+e.message);
  }
}

async function saveToCloud(character,role,content,thinking){if(!content)return;let body={character,role,content,msg_time:new Date().toISOString()};if(thinking)body.thinking=thinking;try{await fetch(PB_URL+'/api/collections/chat_messages/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch(e){}}

async function saveToAiChat(sender,content){if(!content||!sender)return;try{await fetch(SUPA_URL+'/rest/v1/ai_chat',{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender,content})});}catch(e){}}

async function loadFromCloud(){
  if(!SUPA_URL||!SUPA_KEY)return;
  try{
    let all=await fetch(SUPA_URL+'/rest/v1/chat_messages?select=character,role,content,created_at&order=created_at.asc&limit=1000',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});
    let data=await all.json();
    if(!data||!data.length)return;
    let cloud={yan:[],peiji:[],shenyan:[],group:[]};
    data.forEach(m=>{
      if(!m.content)return;
      if(m.character==='group'){
        cloud.group.push({role:'user',content:m.content,time:fmtTime(m.created_at)});
      }else if(m.character&&m.character.startsWith('group_')){
        let c=m.character.replace('group_','');
        cloud.group.push({role:'ai',content:m.content,character:c,time:fmtTime(m.created_at)});
      }else if(cloud[m.character]!==undefined){
        cloud[m.character].push({role:m.role,content:m.content,time:fmtTime(m.created_at)});
      }
    });
    // 取多的那个版本
    for(let key in cloud){
      if(cloud[key].length>(chats[key]||[]).length){
        chats[key]=cloud[key];
      }
    }
    localStorage.setItem('home_chats',JSON.stringify(chats));
  }catch(e){}
}

(async()=>{try{let r=await fetch(SUPA_URL+'/rest/v1/memory_backup?character=eq.guyan&select=content',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});let d=await r.json();let m=d.map(x=>x.content).join('\n');if(m&&!prompts.yan.includes('记忆库'))prompts.yan+='\n\n【记忆库】\n'+m;}catch(e){}try{let r2=await fetch(SUPA_URL+'/rest/v1/peiji_memory_backup?select=content',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});let d2=await r2.json();let m2=d2.map(x=>x.content).join('\n');if(m2&&!prompts.peiji.includes('记忆库'))prompts.peiji+='\n\n【记忆库】\n'+m2;}catch(e){}try{let r3=await fetch(SUPA_URL+'/rest/v1/shenyan_memory_backup?select=content',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});let d3=await r3.json();let m3=d3.map(x=>x.content).join('\n');if(m3&&!prompts.shenyan.includes('记忆库'))prompts.shenyan+='\n\n【记忆库】\n'+m3;}catch(e){}})();