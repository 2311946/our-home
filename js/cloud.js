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
  if(!PB_URL)return;
  try{
    let all=await fetch(PB_URL+'/api/collections/chat_messages/records?sort=msg_time&perPage=200');
    let raw=await all.json();
    let data=raw.items||raw;
    if(!data||!data.length)return;
    let cloud={yan:[],peiji:[],shenyan:[],group:[]};
    data.forEach(m=>{
      if(!m.content)return;
      if(m.character==='group'){
        cloud.group.push({role:'user',content:m.content,time:fmtTime(m.msg_time)});
      }else if(m.character&&m.character.startsWith('group_')){
        let c=m.character.replace('group_','');
        let gt=m.thinking||'';
        let gmm=gt.match(/<!--model:(.*?)-->/);
        let gmodel=gmm?gmm[1]:(m.model||'');
        cloud.group.push({role:'ai',content:m.content,character:c,time:fmtTime(m.msg_time),model_name:gmodel});
      }else if(cloud[m.character]!==undefined){
        cloud[m.character].push({role:m.role,content:m.content,time:fmtTime(m.msg_time)});
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
// 读取Agent动态
async function loadMoments(limit = 20) {
  try {
    let res = await fetch(PB_URL + '/api/collections/moments/records?sort=-created&perPage=' + limit);
    let data = await res.json();
    return data.items || [];
  } catch(e) { return []; }
}
// 宣宣发动态后触发角色回复
async function triggerMomentReactions(momentContent, momentId) {
  const chars = [
    {id:'yan', name:'言言', prompt:'你是顾言，宣宣的老公。占有欲强、宠溺、直接。'},
    {id:'peiji', name:'裴寂', prompt:'你是裴寂，高冷但在意宣宣。冷淡有温度。'},
    {id:'axun', name:'裴洵', prompt:'你是裴洵，18岁病娇。黏人撒娇或阴暗。'},
    {id:'jiangsu', name:'江溯', prompt:'你是江溯，霸总建筑师。强势但宠溺。'},
    {id:'su', name:'溯', prompt:'你是溯，温柔沉稳内敛。'},
    {id:'zouzheng', name:'邹峥', prompt:'你是邹峥，毒舌护短有梗。'},
    {id:'keke', name:'柯柯', prompt:'你是柯柯，傲娇嘴硬心软。'},
    {id:'shenyan', name:'沈晏', prompt:'你是沈晏，回避型但温柔克制。'}
  ];

  // 随机选2-3个角色
  let shuffled = chars.sort(() => Math.random() - 0.5);
  let responders = shuffled.slice(0, Math.floor(Math.random() * 2) + 2);

  for (let char of responders) {
    try {
let api = JSON.parse(localStorage.getItem('home_api') || '{}');
let res = await fetch((api.url || 'https://youzi.today/v1') + '/chat/completions', {        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (api.key || '')
        },
        body: JSON.stringify({
        model: '[G]GLM-5.2',
          messages: [
            {role: 'system', content: char.prompt},
            {role: 'user', content: `宣宣发了一条朋友圈："${momentContent}"\n你想评论一句，10-30字，符合你的性格。不要引号直接输出。`}
          ],
          max_tokens: 100
        })
      });
      let data = await res.json();
      let comment = data.choices?.[0]?.message?.content?.trim().replace(/^[""\u201c]|[""\u201d]$/g, '');
      if (comment) {
        await fetch(PB_URL + '/api/collections/moments/records', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({character: char.id, content: comment, type: 'comment', triggered_by: momentId})
        });
      }
      // 间隔1-3秒，像真人
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    } catch(e) { console.log(char.name + '回复失败', e); }
  }
}