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
    if(m.character&&m.character.indexOf('group_')===0){
    let gt=m.thinking||'';
    let gin=0,gout=0,gm='';
    let gtm=gt.match(/<!--tokens:(\d+)\/(\d+)-->/);
    if(gtm){gin=parseInt(gtm[1]);gout=parseInt(gtm[2]);gt=gt.replace(gtm[0],'').trim();}
    let gmm=gt.match(/<!--model:(.*?)-->/);
    if(gmm){gm=gmm[1];gt=gt.replace(gmm[0],'').trim();}
    if(m.model)gm=gm||m.model;
    return {role:'ai',content:m.content,character:m.character.slice(6),thinking:gt,in_tokens:gin,out_tokens:gout,model_name:gm,time:fmtTime(m.msg_time),pb_id:m.id};
  }
    let charId=nameMap[m.role]||m.role;
    if(charId==='user')return {role:'user',content:m.content,time:fmtTime(m.msg_time),pb_id:m.id};
   
            let thinking = m.thinking || '';
      let in_tokens = 0, out_tokens = 0, model_name = '';
      let tm = thinking.match(/<!--tokens:(\d+)\/(\d+)-->/);
      if(tm) {
        in_tokens = parseInt(tm[1]);
        out_tokens = parseInt(tm[2]);
        thinking = thinking.replace(tm[0], '').trim();
      }
      let mm = thinking.match(/<!--model:(.*?)-->/);
      if(mm) {
        model_name = mm[1];
        thinking = thinking.replace(mm[0], '').trim();
      }
      if(!model_name && m.model) model_name = m.model;

   return {role:'ai',content:m.content,character:charId,thinking:thinking,in_tokens:in_tokens,out_tokens:out_tokens,model_name:model_name,time:fmtTime(m.msg_time),pb_id:m.id};
  });
  chatLoading=false;render();renderList();return;
}let msgs=data.reverse().map(m=>{
      
            let thinking = m.thinking || '';
      let in_tokens = 0, out_tokens = 0, model_name = '';
      let tm = thinking.match(/<!--tokens:(\d+)\/(\d+)-->/);
      if(tm) {
        in_tokens = parseInt(tm[1]);
        out_tokens = parseInt(tm[2]);
        thinking = thinking.replace(tm[0], '').trim();
      }
      let mm = thinking.match(/<!--model:(.*?)-->/);
      if(mm) {
        model_name = mm[1];
        thinking = thinking.replace(mm[0], '').trim();
      }

      return {role:m.role,content:m.content,thinking:thinking,in_tokens:in_tokens,out_tokens:out_tokens,model_name:model_name,time:m.msg_time?new Date(m.msg_time).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'',character:m.character,pb_id:m.id};
  });
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

async function saveToCloud(character,role,content,thinking,model){if(!content)return;let body={character,role,content,msg_time:new Date().toISOString()};if(thinking)body.thinking=thinking;if(model)body.model=model;try{await fetch(PB_URL+'/api/collections/chat_messages/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch(e){}}

async function saveToAiChat(sender,content){if(!content||!sender)return;try{await fetch(SUPA_URL+'/rest/v1/ai_chat',{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender,content})});}catch(e){}}

async function loadFromCloud(){
  if(!SUPA_URL||!SUPA_KEY)return;
  try{
    let all=await fetch(SUPA_URL+'/rest/v1/chat_messages?select=character,role,content,created_at,model,thinking&order=created_at.asc&limit=1000',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});
    let data=await all.json();
    if(!data||!data.length)return;
    let cloud={yan:[],peiji:[],shenyan:[],group:[]};
    data.forEach(m=>{
      if(!m.content)return;
      if(m.character==='group'){
        cloud.group.push({role:'user',content:m.content,time:fmtTime(m.created_at)});
      }else if(m.character&&m.character.startsWith('group_')){
        let c=m.character.replace('group_','');
        let gt=m.thinking||'';
        let gmm=gt.match(/<!--model:(.*?)-->/);
        let gmodel=gmm?gmm[1]:(m.model||'');
        cloud.group.push({role:'ai',content:m.content,character:c,time:fmtTime(m.created_at),model_name:gmodel});
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

// [已迁移至OB MCP] Supabase memory_backup 请求已移除

async function loadPromptsFromCloud() {
  if (!PB_URL) return;
  try {
    let res = await fetch(PB_URL + '/api/collections/char_prompts/records?perPage=50');
    let data = await res.json();
    if (data && data.items) {
      data.items.forEach(item => {
        if (item.character && item.prompt) {
          prompts[item.character] = item.prompt;
        }
      });
      localStorage.setItem('home_prompts', JSON.stringify(prompts));
    }
  } catch(e) {}
}

async function savePromptToCloud(character, promptText) {
  if (!PB_URL || !character) return;
  try {
    let res = await fetch(PB_URL + '/api/collections/char_prompts/records?filter=(character="' + character + '")');
    let data = await res.json();
    if (!res.ok) console.error('GET char_prompts 报错:', data);
    
    if (data && data.items && data.items.length > 0) {
      let id = data.items[0].id;
      let patchRes = await fetch(PB_URL + '/api/collections/char_prompts/records/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      if (!patchRes.ok) { let err = await patchRes.json(); console.error('PATCH char_prompts 报错:', err); }
    } else {
      let postRes = await fetch(PB_URL + '/api/collections/char_prompts/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: character, prompt: promptText })
      });
      if (!postRes.ok) { let err = await postRes.json(); console.error('POST char_prompts 报错:', err); }
    }
  } catch(e) {
    console.error('savePromptToCloud 捕获到异常:', e);
  }
}