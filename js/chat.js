
function getApiForChar(charId) {
  let presetName = localStorage.getItem('preset_'+charId);
  if(presetName) {
    let presets = JSON.parse(localStorage.getItem('api_presets')||'{}');
    if(presets[presetName]) {
      return {
        url: presets[presetName].url.replace(/\/$/, ''),
        key: presets[presetName].key,
        model: localStorage.getItem('model_'+charId) || presets[presetName].model
      };
    }
  }
  return {
    url: apiConfig.url.replace(/\/$/, ''),
    key: apiConfig.key,
    model: localStorage.getItem('model_'+charId) || apiConfig.model
  };
}

function importChat(input){
  let file=input.files[0];
  if(!file)return;
  let reader=new FileReader();
  reader.onload=function(e){
    try{
      let data=JSON.parse(e.target.result);
      // 兼容多种格式
      if(Array.isArray(data)){
        // 格式: [{role,content,time}]
        let charId=prompt('导入到哪个角色？(yan/peiji/shenyan)','yan');
        if(!charId||!chats[charId])return;
        data.forEach(m=>{
          chats[charId].push({role:m.role||'user',content:m.content||m.text||'',time:m.time||m.timestamp||''});
        });
      }else if(data.messages){
        // 格式: {messages:[{role,content}]}
        let charId=prompt('导入到哪个角色？(yan/peiji/shenyan)','yan');
        if(!charId||!chats[charId])return;
        data.messages.forEach(m=>{
          if(m.role==='system')return;
          chats[charId].push({role:m.role==='assistant'?'ai':'user',content:m.content||'',time:''});
        });
      }
      localStorage.setItem('home_chats',JSON.stringify(chats));
      renderList();
      if(currentChar)render();
      alert('导入成功！共'+chats[prompt?charId:'yan'].length+'条消息');
    }catch(err){
      alert('导入失败：文件格式不对\n'+err.message);
    }
  };
  reader.readAsText(file);
  input.value='';
}

function jumpToSearchResult(role, char, content){
  // 1. 关闭搜索框
  let sb=document.getElementById('searchBar');
  if(sb)sb.style.display='none';
  let si=document.getElementById('searchInput');
  if(si)si.value='';
  // 2. 显示真实聊天（恢复对话气泡）
  render();
  // 3. 定位并高亮闪烁
  let box=document.getElementById('chatBox');
  if(!box)return;
  let target=null;
  box.querySelectorAll('.msg-row').forEach(r=>{
    if(r.dataset.role!==role)return;
    if(char && r.dataset.char && r.dataset.char!==char)return;
    if((r.dataset.content||'')===content){ if(!target)target=r; }
  });
  if(!target)return;
  target.scrollIntoView({behavior:'smooth',block:'center'});
  target.classList.add('flash');
  setTimeout(()=>target.classList.remove('flash'),2000);
}

let searchHistTimer=null;

function getSearchHistory(){try{return JSON.parse(localStorage.getItem('ourhome_search_history_'+currentChar)||'[]');}catch(e){return [];}}

function addSearchHistory(kw){kw=(kw||'').trim();if(!kw)return;let h=getSearchHistory().filter(x=>x!==kw);h.unshift(kw);if(h.length>12)h=h.slice(0,12);localStorage.setItem('ourhome_search_history_'+currentChar,JSON.stringify(h));}

function renderSearchHistory(){
  let box=document.getElementById('searchHistory');if(!box)return;
  let h=getSearchHistory();
  if(!h.length){box.style.display='none';box.innerHTML='';return;}
  box.style.display='block';box.innerHTML='';
  let title=document.createElement('div');title.style.cssText='font-size:12px;color:#888;margin-bottom:6px';title.textContent='最近搜索';box.appendChild(title);
  h.forEach(kw=>{
    let chip=document.createElement('span');chip.style.cssText='display:inline-flex;align-items:center;gap:6px;background:#253554;color:#eee;padding:4px 10px;border-radius:14px;font-size:13px;margin:0 6px 6px 0;cursor:pointer';
    let t=document.createElement('span');t.textContent=kw;t.onclick=()=>{let si=document.getElementById('searchInput');if(si){si.value=kw;doSearch();}};
    let x=document.createElement('span');x.textContent='✕';x.title='删除该搜索记录';x.style.cssText='color:#e74c3c;cursor:pointer;font-size:12px';x.onclick=(e)=>{e.stopPropagation();let arr=getSearchHistory().filter(y=>y!==kw);localStorage.setItem('ourhome_search_history_'+currentChar,JSON.stringify(arr));renderSearchHistory();};
    chip.appendChild(t);chip.appendChild(x);box.appendChild(chip);
  });
}

function doSearch() {
  let kw = document.getElementById('searchInput').value.trim();
  let sh=document.getElementById('searchHistory');
  if (!kw) { if(sh)sh.style.display='none'; render(); renderSearchHistory(); return; }
  if(sh)sh.style.display='none';
  clearTimeout(searchHistTimer); searchHistTimer=setTimeout(()=>addSearchHistory(kw),1500);
  if (!PB_URL) { render(); return; }
  let isGroup=currentChar==='group';
  let kwEnc=encodeURIComponent(kw);
  // 该 PocketBase 版本不支持多条件 AND 过滤（&&/|| 会被忽略，只认第一个条件），
  // 所以只用单个 content~ 条件查全库，再在前端按当前聊天角色筛选
  let url=PB_URL+'/api/collections/chat_messages/records?filter=(content~"'+kwEnc+'")&sort=-msg_time&perPage=500';
  let box = document.getElementById('chatBox');
  box.innerHTML = '<div style="text-align:center;padding:20px;color:#888">搜索中...</div>';
  let opts=url.startsWith(PB_URL)?{}:{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}};
  fetch(url, opts).then(r=>r.json()).then(raw=>{let data=raw.items||raw;
    if(isGroup){data=data.filter(m=>m.character==='group'||(m.character&&m.character.indexOf('group_')===0));}
    else{data=data.filter(m=>m.character===currentChar);}
    box.innerHTML = '';
    if (!data.length) {
      box.innerHTML = '<div style="text-align:center;padding:20px;color:#888">没有找到</div>';
      return;
    }
    data.forEach(m => {
      let role,character;
      if(isGroup){
        let nameMap={'宣宣':'user','顾言':'yan','裴寂':'peiji','裴洵':'axun','江溯':'jiangsu','溯':'su','邹峥':'zouzheng','柯柯':'keke','沈晏':'shenyan'};
        let charId;
        if(m.character&&m.character.indexOf('group_')===0){charId=m.character.slice(6);role='ai';character=charId;}
        else{charId=nameMap[m.role]||m.role;if(charId==='user'){role='user';character='';}else{role='ai';character=charId;}}
      }else{
        role=m.role;character='';
      }
      let row = document.createElement('div');
      row.className = 'msg-row ' + role;
      row.style.cursor = 'pointer';
      row.title = '点击定位到对话中的这条消息';
      row.onclick = () => jumpToSearchResult(role, character, m.content);
      let av = document.createElement('div');
      av.className = 'avatar';
      av.style.background = avatarColors[role === 'user' ? 'user' : character] || '#555';
      av.textContent = avatarEmoji[role === 'user' ? 'user' : character] || '?';
      if(role !== 'user'){
        av.onclick=function(e){e.stopPropagation();openProfile(character);};
        av.style.cursor='pointer';
      }else{
        av.onclick=function(e){e.stopPropagation();openProfile('xuanxuan');};
        av.style.cursor='pointer';
      }
      let body = document.createElement('div');
      body.className = 'msg-body ' + m.role;
      let d = document.createElement('div');
      d.className = 'bubble ' + role;if(isGroup&&role==='ai')d.style.borderLeft='3px solid '+(charColors[character]||'#9b59b6');
      d.innerHTML = m.content.replace(
        new RegExp('(' + kw + ')', 'gi'),
        '<mark style="background:#f1c40f;color:#000">$1</mark>'
      );
      let time = document.createElement('div');
      time.style.cssText = 'font-size:11px;color:#888;margin-top:4px';
time.textContent = m.msg_time
  ? new Date(m.msg_time).toLocaleString('zh-CN') : '';      body.appendChild(d);
      body.appendChild(time);
      row.appendChild(av);
      row.appendChild(body);
      box.appendChild(row);
    });
  }).catch(() => {
    box.innerHTML = '<div style="text-align:center;padding:20px;color:#f00">搜索失败</div>';

let charClass=(m.role==='ai')?(isGroup?(m.character||''):(currentChar||'')):'';
d.className='msg '+m.role+(charClass?' '+charClass:'');d.textContent=m.content;d.oncontextmenu=function(ev){ev.preventDefault();showReactMenu(ev,i);};if(m.reactions&&m.reactions.length){let rDiv=document.createElement('div');rDiv.style.cssText='font-size:14px;margin-top:2px;';rDiv.textContent=m.reactions.join('');d.appendChild(rDiv);}body.appendChild(d);if(m.time){let t=document.createElement('div');t.className='msg-time';t.textContent=m.time + (m.model_name ? ' · 🤖 ' + m.model_name : '') + ((m.in_tokens || m.out_tokens) ? ' · 消耗: '+m.in_tokens+'⬆ '+m.out_tokens+'⬇' : '');body.appendChild(t);}row.appendChild(av);row.appendChild(body);box.appendChild(row);});}

let groupTypingChar=null;let groupAmbient=null;
function getReplyDelay(charId){let sp=replySpeed[charId]||'normal';if(sp==='fast')return 800+Math.floor(Math.random()*700);if(sp==='slow')return 1500+Math.floor(Math.random()*1000);return 1000+Math.floor(Math.random()*1000);}
function render(){let box=document.getElementById('chatBox');box.innerHTML='';if(chatHasMore[currentChar]&&currentChar!=='group'){let btn=document.createElement('div');btn.style.cssText='text-align:center;padding:12px;color:#888;cursor:pointer;font-size:13px';btn.textContent='⬆ 加载更早的消息';btn.onclick=()=>loadCloudChat(currentChar,true);box.appendChild(btn);}(chats[currentChar]||[]).forEach((m,i)=>{let isGroup=currentChar==='group';let charKey=m.role==='user'?'user':(isGroup?m.character:currentChar);let row=document.createElement('div');row.className='msg-row '+m.role+(m.animate?' animate':'');row.dataset.role=m.role;row.dataset.content=m.content||'';if(isGroup&&m.role==='ai')row.dataset.char=m.character||'';let av=document.createElement('div');av.className='avatar';av.style.background=avatarColors[charKey]||'#555';av.textContent=avatarEmoji[charKey]||'?';if(charKey!=='user'){av.onclick=function(e){e.stopPropagation();openProfile(charKey);};av.style.cursor='pointer';}else{av.onclick=function(e){e.stopPropagation();openProfile('xuanxuan');};av.style.cursor='pointer';}let body=document.createElement('div');body.className='msg-body '+m.role;let roleColor=(isGroup&&m.role==='ai')?(charColors[m.character]||'#9b59b6'):null;if(m.role==='ai'){let name=document.createElement('div');name.className='msg-name';name.textContent=charNames[charKey]||'';if(roleColor)name.style.color=roleColor;body.appendChild(name);}let d=document.createElement('div');
let charClass=(m.role==='ai')?(isGroup?(m.character||''):(currentChar||'')):'';
d.className='msg '+m.role+(charClass?' '+charClass:'');if(roleColor)d.style.borderLeft='3px solid '+roleColor;if(m.content&&m.content.startsWith('[img]')){let img=document.createElement('img');img.src=m.content.slice(5);img.style.cssText='max-width:200px;border-radius:12px;cursor:pointer';img.onclick=()=>{showImgPreview(img.src)};d.appendChild(img);}else{
  let content=m.content||'正在输入...';
  if(m.role==='ai'&&content.includes('```')){
    let parts=content.split(/```[\s\S]*?```/);
    let codes=content.match(/```[\s\S]*?```/g)||[];
    let textPart=parts.join('').trim();
    let codePart=codes.map(c=>c.replace(/```\w*\n?/g,'').replace(/```/g,'').trim()).join('\n');
    d.textContent=textPart;
    if(codePart){
      let fold=document.createElement('div');
      fold.style.cssText='margin-top:8px;padding:8px 12px;background:#1a1a2e;border-radius:8px;cursor:pointer;font-size:13px;color:#9b59b6';
      fold.textContent='💭 daddy在想什么...';
      let codeDiv=document.createElement('div');
      codeDiv.style.cssText='display:none;margin-top:6px;padding:10px;background:#1a1a2e;border-radius:8px;font-size:13px;color:#aaa;white-space:pre-wrap;line-height:1.5';
      codeDiv.textContent=codePart;
      fold.onclick=(e)=>{
        e.stopPropagation();
        if(codeDiv.style.display==='none'){
          codeDiv.style.display='block';
          fold.textContent='💭 收起';
        }else{
          codeDiv.style.display='none';
          fold.textContent='💭 daddy在想什么...';
        }
      };
      d.appendChild(fold);
      d.appendChild(codeDiv);
    }
  }else{
    if(m.quote){
      let quoteDiv=document.createElement('div');
      quoteDiv.style.cssText='background:rgba(100,100,100,0.2);border-left:3px solid #666;padding:6px 10px;margin-bottom:8px;border-radius:6px;font-size:12px;color:#888;font-style:italic;max-height:60px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical';
      quoteDiv.textContent=m.quote.sender+': '+m.quote.text;
      d.appendChild(quoteDiv);
      let mainText=document.createElement('div');
      mainText.textContent=content;
      d.appendChild(mainText);
    }else if(content.startsWith('> ')){
      let parts=content.split('\n\n');
      if(parts.length>=2){
        let quoteDiv=document.createElement('div');
        quoteDiv.style.cssText='background:rgba(100,100,100,0.2);border-left:3px solid #666;padding:6px 10px;margin-bottom:8px;border-radius:6px;font-size:12px;color:#888;font-style:italic';
        quoteDiv.textContent=parts[0].replace('> ','');
        d.appendChild(quoteDiv);
        let mainText=document.createElement('div');
        mainText.textContent=parts.slice(1).join('\n\n');
        d.appendChild(mainText);
      }else{
        d.textContent=content;
      }
    }else{
      d.textContent=content;
    }
  }
}if(m.thinking){console.log('THINK HIT',m.thinking.slice(0,20));let thinkDiv=document.createElement('details');thinkDiv.style.cssText='margin-bottom:6px;padding:6px 10px;background:rgba(155,89,182,0.1);border-radius:8px;font-size:12px;color:#888';let sum=document.createElement('summary');sum.style.cssText='cursor:pointer;color:#9b59b6;font-size:12px';sum.textContent='💭 思考过程';thinkDiv.appendChild(sum);let thinkText=document.createElement('div');thinkText.style.cssText='margin-top:6px;white-space:pre-wrap;line-height:1.6';thinkText.textContent=m.thinking;thinkDiv.appendChild(thinkText);d.insertBefore(thinkDiv,d.firstChild);}d.onclick=()=>{document.querySelectorAll('.msg-menu').forEach(x=>x.remove());let menu=document.createElement('div');menu.className='msg-menu';let btns='<button onclick="copyMsg('+i+')">复制</button><button onclick="delMsg('+i+')">删除</button><button onclick="showReactPick('+i+')">表情</button><button onclick="quoteMsg('+i+')">💬 引用</button>';if(m.role==='ai')btns+='<button onclick="reGen('+i+')">重新回复</button>';menu.innerHTML=btns;d.appendChild(menu);setTimeout(()=>menu.remove(),3000);};body.appendChild(d);if(m.time){let t=document.createElement('div');t.className='msg-time';t.textContent=m.time + (m.model_name ? ' · 🤖 ' + m.model_name : '') + ((m.in_tokens || m.out_tokens) ? ' · 消耗: '+m.in_tokens+'⬆ '+m.out_tokens+'⬇' : '');body.appendChild(t);}row.appendChild(av);row.appendChild(body);box.appendChild(row);});if(currentChar==='group'&&groupTypingChar){let ti=document.createElement('div');ti.id='typingIndicator';ti.style.cssText='font-size:12px;color:#888;font-style:italic;text-align:left;padding:8px';ti.textContent='🤔 '+(charNames[groupTypingChar]||groupTypingChar)+' 正在输入...';box.appendChild(ti);}if(currentChar==='group'&&groupAmbient){let ai=document.createElement('div');ai.className='ambient-msg';ai.style.cssText='font-size:12px;color:#888;font-style:italic;text-align:center;padding:4px';ai.textContent=groupAmbient;box.appendChild(ai);}box.scrollTop=box.scrollHeight;}

function copyMsg(i){navigator.clipboard.writeText(chats[currentChar][i].content);}

function delMsg(i){let msg=chats[currentChar][i];if(msg&&msg.pb_id&&PB_URL){fetch(PB_URL+'/api/collections/chat_messages/records/'+msg.pb_id,{method:'DELETE'}).catch(()=>{});}chats[currentChar].splice(i,1);localStorage.setItem('home_chats',JSON.stringify(chats));render();}

function reGen(i){
  if(!currentChar || !chats[currentChar])return;
  if(!chats[currentChar][i] || chats[currentChar][i].role!=='ai')return;

  if(currentChar==='group'){
    reGenGroup(i);
    return;
  }

  chats[currentChar].splice(i);
  localStorage.setItem('home_chats',JSON.stringify(chats));
  render();

  sendMsg(true);
}

function exportChat(){
  let output='';
  ['yan','peiji','shenyan','group'].forEach(charId=>{
    let msgs=chats[charId]||[];
    if(!msgs.length)return;
    output+='\n\n========== '+(charNames[charId]||charId)+' ==========\n\n';
    msgs.forEach(m=>{
      let time=m.time||'';
      let speaker=m.role==='user'?'宣宣':(m.character?charNames[m.character]:charNames[charId]);
      output+='['+time+'] '+speaker+'：'+(m.content||'')+'\n\n';
    });
  });
  if(!output){alert('没有聊天记录');return;}
  let blob=new Blob([output],{type:'text/plain;charset=utf-8'});
  let a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='our-home-chat-'+new Date().toISOString().slice(0,10)+'.txt';
  a.click();
  URL.revokeObjectURL(a.href); showToast('导出成功');
}

function reGenGroup(i){
  let msg=chats.group[i];
  let c=msg.character;
  if(!c||!prompts[c])return;

  // 删掉这条及该角色在这之后的连续消息
  let endIdx=i+1;
  while(endIdx<chats.group.length && chats.group[endIdx].role==='ai' && chats.group[endIdx].character===c){
    endIdx++;
  }
  chats.group.splice(i, endIdx-i);

  // 重新生成
  chats.group.splice(i, 0, {role:'ai', content:'', character:c, time:nowTime()});
  localStorage.setItem('home_chats',JSON.stringify(chats));
  render();

  let msgs=[{role:'system',content:prompts[c]+'\n\n当前真实时间：'+aiNowTime()+'。\n\n【这是群聊，参与者有：宣宣、言言、裴寂、沈晏、裴洵、江溯、溯、邹峥、柯柯。你回应任何人的话。不要说自己是AI，直接以角色身份回复。如果你想发多条消息，用 ||| 分隔每条消息。不要在回复里加时间戳或自己的名字前缀。】'}];

  chats.group.slice(0,i).forEach(m=>{
    if(m.role==='user')msgs.push({role:'user',content:'宣宣: '+m.content});
    else if(m.role==='ai'&&m.content){
      if(m.character===c)msgs.push({role:'assistant',content:m.content});
      else msgs.push({role:'user',content:(charNames[m.character]||'')+': '+m.content});
    }
  });

  let idx=i;
  (()=>{
    let api = getApiForChar(c);
    return fetch(api.url+'/chat/completions',{
      method:'POST',
      headers:{'Authorization':'Bearer '+api.key,'Content-Type':'application/json'},
      body:JSON.stringify({model:api.model,messages:msgs,stream:true,stream_options:{include_usage:true}})
    });
  })().then(res=>{
    let reader=res.body.getReader();
    let dec=new TextDecoder();
    let buf='';
    function read(){
      reader.read().then(({done,value})=>{
        if(done){
          // 分条拆分
          let fullContent=chats.group[idx].content;
          let parts=fullContent.split('|||').map(s=>s.trim()).filter(s=>s);
      if(parts.length>1){
        chats.group[idx].content=parts[0];
        for(let pi=1;pi<parts.length;pi++){
          chats.group.splice(idx+pi,0,{role:'ai',content:parts[pi],character:c,time:nowTime()});
        }
        parts.forEach(p=>saveToCloud('group_'+c,'ai',p));
      }else{
        saveToCloud('group_'+c,'ai',fullContent, (chats.group[idx].thinking||'') + (chats.group[idx].in_tokens?' <!--tokens:'+chats.group[idx].in_tokens+'/'+chats.group[idx].out_tokens+'-->':'') + (chats.group[idx].model_name?' <!--model:'+chats.group[idx].model_name+'-->':''));
      }
      localStorage.setItem('home_chats',JSON.stringify(chats));
      render();
      return;
        }
        buf+=dec.decode(value,{stream:true});
        let lines=buf.split('\n');buf=lines.pop();
        for(let line of lines){
          if(!line.startsWith('data:'))continue;
          let d=line.slice(5).trim();
          if(d==='[DONE]')continue;
          try{
        let j=JSON.parse(d);
        if(j.usage){
            chats.group[idx].in_tokens = j.usage.prompt_tokens||0;
            chats.group[idx].out_tokens = j.usage.completion_tokens||0;
            chats.group[idx].model_name = j.model || (typeof api !== 'undefined' ? api.model : 'unknown');
            let stats=JSON.parse(localStorage.getItem('api_usage_stats')||'{}');
            let mName = typeof api !== 'undefined' ? api.model : 'unknown';
            if(!stats[mName]) stats[mName]={in:0,out:0};
            stats[mName].in+=chats.group[idx].in_tokens;
            stats[mName].out+=chats.group[idx].out_tokens;
            localStorage.setItem('api_usage_stats',JSON.stringify(stats));
        }
        if(j.choices && j.choices.length > 0){
            chats.group[idx].content+=j.choices[0].delta.content||'';
        }
    }catch(e){}
        }
        render();
        read();
      });
    }
    read();
  }).catch(e=>{
    chats.group[idx].content='连接失败';
    render();
  });
}

function clearChat(){if(confirm('确定清空当前对话？')){if(currentChar)chats[currentChar]=[];localStorage.setItem('home_chats',JSON.stringify(chats));render();closeSettings();}}

async function sendImage(input){let file=input.files[0];if(!file)return;let reader=new FileReader();reader.onload=function(e){let imgUrl=e.target.result;chats[currentChar].push({role:'user',content:'[img]'+imgUrl,time:nowTime()});localStorage.setItem('home_chats',JSON.stringify(chats));render();};reader.readAsDataURL(file);input.value='';}

function handleKey(e){
  // 回车只换行，不自动发送
  // 发送消息统一点右侧 ↑ 按钮
  return;
}

async function sendMsg(isRegen){
  let input=document.getElementById('input');
  let text=input.value.trim();
  
  let quoteData=null;
  if(window.quoteMsgData){
    quoteData={sender:window.quoteMsgData.sender,text:window.quoteMsgData.text};
    window.quoteMsgData=null;
    let qp=document.getElementById('quotePreview');
    if(qp)qp.style.display='none';
  }
  
  if(!isRegen&&!text)return;
  if(!apiConfig.url||!apiConfig.key){openSettings();return;}
  if(currentChar==='group'){sendGroupMsg(text,quoteData);input.value='';return;}
  if(!isRegen){
    let msg={role:'user',content:text,time:nowTime()};
    if(quoteData)msg.quote=quoteData;
    chats[currentChar].push(msg);
    input.value='';
  }
  render();
  let contextCount=parseInt(localStorage.getItem('ctx_count_'+currentChar)||localStorage.getItem('ctx_count'))||30;
  let msgs=[];
  if(prompts[currentChar])msgs.push({role:'system',content:prompts[currentChar]+'\n\n当前真实时间：'+aiNowTime()+'。'});
  let groupMsgs=[];
  let useGroupCtx=localStorage.getItem('group_ctx_'+currentChar)==='true';
  let groupCtxCount=parseInt(localStorage.getItem('group_ctx_count_'+currentChar)||'10');
  if(useGroupCtx&&chats.group&&chats.group.length){chats.group.forEach(m=>{if(!m.content)return;if(m.role==='user')groupMsgs.push('宣宣: '+m.content);else if(m.character===currentChar)groupMsgs.push(charNames[currentChar]+': '+m.content);else if(m.character)groupMsgs.push(charNames[m.character]+': '+m.content);});}
  if(groupMsgs.length)msgs.push({role:'system',content:'【以下是群聊记录，你参与过这些对话】\n'+groupMsgs.slice(-groupCtxCount).join('\n')});
chats[currentChar].slice(-contextCount).forEach(m=>{
  if(m.content){
    let apiContent=m.content;
    if(m.quote)apiContent='[引用 '+m.quote.sender+': '+m.quote.text+']\n'+apiContent;
    msgs.push({role:m.role==='ai'?'assistant':'user',content:apiContent});
  }
});chats[currentChar].push({role:'ai',content:'',time:nowTime()});render();try{let api = getApiForChar(currentChar);
  let useStream=localStorage.getItem('stream_'+currentChar)!=='false';
  let res=await fetch(api.url+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.key},body:JSON.stringify({model:api.model,messages:msgs,stream:useStream,stream_options:useStream?{include_usage:true}:undefined})});if(!res.ok){chats[currentChar][chats[currentChar].length-1].content='❌ API错误 '+res.status+': '+(await res.text()).slice(0,200);render();return;}
  if(!useStream){
    let j=await res.json();
    let lastMsg=chats[currentChar][chats[currentChar].length-1];
    if(j.usage){
        lastMsg.in_tokens = j.usage.prompt_tokens||0;
        lastMsg.out_tokens = j.usage.completion_tokens||0;
        lastMsg.model_name = j.model || api.model || 'unknown';
        let stats=JSON.parse(localStorage.getItem('api_usage_stats')||'{}');
        let mName=api.model||'unknown';
        if(!stats[mName]) stats[mName]={in:0,out:0};
        stats[mName].in+=lastMsg.in_tokens;
        stats[mName].out+=lastMsg.out_tokens;
        localStorage.setItem('api_usage_stats',JSON.stringify(stats));
    }
    if(j.choices && j.choices.length > 0){
        let msgObj = j.choices[0].message||{};
        let t = msgObj.content||'';
        let think = msgObj.reasoning_content||msgObj.thinking||'';
        if(think)lastMsg.thinking=think;
        if(t)lastMsg.content=t;
    }
    render();
  }else{
    let reader=res.body.getReader();let decoder=new TextDecoder();let buf='';while(true){let{done,value}=await reader.read();if(done)break;buf+=decoder.decode(value,{stream:true});let lines=buf.split('\n');buf=lines.pop();for(let line of lines){if(!line.startsWith('data:'))continue;let data=line.slice(5).trim();if(data==='[DONE]')break;try{
        let j=JSON.parse(data);
        if(j.usage){
            let lastMsg=chats[currentChar][chats[currentChar].length-1];
            lastMsg.in_tokens = j.usage.prompt_tokens||0;
            lastMsg.out_tokens = j.usage.completion_tokens||0;
            lastMsg.model_name = j.model || api.model || 'unknown';
            let stats=JSON.parse(localStorage.getItem('api_usage_stats')||'{}');
            let mName=api.model||'unknown';
            if(!stats[mName]) stats[mName]={in:0,out:0};
            stats[mName].in+=lastMsg.in_tokens;
            stats[mName].out+=lastMsg.out_tokens;
            localStorage.setItem('api_usage_stats',JSON.stringify(stats));
        }
        if(j.choices && j.choices.length > 0){
            let t=j.choices[0].delta.content||'';
            let think=j.choices[0].delta.reasoning_content||j.choices[0].delta.thinking||'';
            let last=chats[currentChar][chats[currentChar].length-1];
            if(think)last.thinking=(last.thinking||'')+think;
            if(t)last.content+=t;
        }
    }catch(e){}}render();}
  }
}catch(e){chats[currentChar][chats[currentChar].length-1].content='❌ 连接失败: '+e.message;render();}
let lastMsg=chats[currentChar][chats[currentChar].length-1];
if(lastMsg.content.includes('<think>')){let thinkMatch=lastMsg.content.match(/<think>([\s\S]*?)<\/think>/);if(thinkMatch){lastMsg.thinking=thinkMatch[1].trim();lastMsg.content=lastMsg.content.replace(/<think>[\s\S]*?<\/think>/,'').trim();render();}}
localStorage.setItem('home_chats',JSON.stringify(chats));
if(!isRegen)saveToCloud(currentChar,'user',text);
setTimeout(()=>{let lastMsg=chats[currentChar][chats[currentChar].length-1];saveToCloud(currentChar,'ai',lastMsg.content,lastMsg.thinking + (lastMsg.in_tokens?' <!--tokens:'+lastMsg.in_tokens+'/'+lastMsg.out_tokens+'-->':'') + (lastMsg.model_name?' <!--model:'+lastMsg.model_name+'-->':''));},500);
}

async function sendGroupMsg(text,quoteData){
  let contextCount=parseInt(localStorage.getItem('ctx_count'))||30;

  if(!text)return;

  let msg={
    role:'user',
    content:text,
    sender:'宣宣',
    time:nowTime()
  };
  if(quoteData)msg.quote=quoteData;
  chats.group.push(msg);
  saveToCloud('group','user',text);
  render();

  let allChars=characters.map(c=>c.id).filter(id=>id!=='group');
  let responders=[];
  if(text.includes('@全体')){responders=shuffle(allChars);}
  else{
    let mentioned=allChars.filter(id=>text.includes('@'+(charNames[id]||'')));
    if(mentioned.length>0){responders=mentioned;}
    else{
      let mode=localStorage.getItem('group_reply_mode')||'1-3';
      if(mode==='all'){responders=shuffle(allChars);}
      else{let count;if(mode==='1-3')count=Math.floor(Math.random()*3)+1;else if(mode==='2-5')count=Math.floor(Math.random()*4)+2;else count=parseInt(mode)||1;responders=shuffle(allChars).slice(0,count);}
    }
  }

  // 角色间@互动连锁回复：最多2轮连锁，每个角色最多回复一次，不能@自己触发自己
  groupAmbient=null; // 新回合：清掉上一次的随机氛围动作
  let replied=new Set(responders);
  let queue=responders.map(c=>({c, level:0}));
  let MAX_CHAIN=2;

  while(queue.length){
    let item=queue.shift();
    let c=item.c;
    let level=item.level;
    if(!prompts[c])continue;
    if(level>0){await new Promise(r=>setTimeout(r,500));} // 连锁回复之间加500ms延迟，模拟真实对话节奏
    groupTypingChar=c; // 群聊：显示"正在输入"指示器（render 会追加到聊天区底部）

    chats.group.push({role:'ai',content:'',character:c,time:nowTime()});
    render();
    await new Promise(r=>setTimeout(r,getReplyDelay(c))); // 角色间随机延迟（按角色回复速度 800-2500ms），延迟期间继续显示"正在输入"
    let ctxCount=parseInt(localStorage.getItem('ctx_count_'+c)||localStorage.getItem('ctx_count'))||30;
    let msgs=[{role:'system',content:prompts[c]+'\n\n当前真实时间：'+aiNowTime()+'。\n\n【这是群聊，参与者有：宣宣、言言、裴寂、沈晏、裴洵、江溯、溯、邹峥、柯柯。你回应任何人的话。不要说自己是AI，直接以角色身份回复。如果你想发多条消息，用 ||| 分隔每条消息。例如：第一句话|||第二句话|||第三句话。不要在回复里加时间戳或自己的名字前缀。】'}];
    chats.group.slice(-ctxCount).forEach(m=>{if(m.role==='user')msgs.push({role:'user',content:'宣宣: '+m.content});else if(m.role==='ai'&&m.content){if(m.character===c)msgs.push({role:'assistant',content:m.content});else msgs.push({role:'user',content:(charNames[m.character]||'')+': '+m.content});}});
    let idx=chats.group.length-1;
    try{
      let api = getApiForChar(c);
      let useStream=localStorage.getItem('stream_'+c)!=='false';
      let res=await fetch(api.url+'/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+api.key,'Content-Type':'application/json'},body:JSON.stringify({model:api.model,messages:msgs,stream:useStream,stream_options:useStream?{include_usage:true}:undefined})});
      if(!useStream){
        let j=await res.json();
        if(j.usage){
          chats.group[idx].in_tokens = j.usage.prompt_tokens||0;
          chats.group[idx].out_tokens = j.usage.completion_tokens||0;
          chats.group[idx].model_name = j.model || (typeof api !== 'undefined' ? api.model : 'unknown');
          let stats=JSON.parse(localStorage.getItem('api_usage_stats')||'{}');
          let mName=api.model||'unknown';
          if(!stats[mName]) stats[mName]={in:0,out:0};
          stats[mName].in+=chats.group[idx].in_tokens;
          stats[mName].out+=chats.group[idx].out_tokens;
          localStorage.setItem('api_usage_stats',JSON.stringify(stats));
        }
        if(j.choices && j.choices.length > 0){
          let msgObj = j.choices[0].message||{};
          chats.group[idx].content+=msgObj.content||'';
        }
        render();
      }else{
        let reader=res.body.getReader();let dec=new TextDecoder();let buf='';while(true){let{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});let lines=buf.split('\n');buf=lines.pop();for(let line of lines){if(!line.startsWith('data:'))continue;let d=line.slice(5).trim();if(d==='[DONE]')break;try{
          let j=JSON.parse(d);
          if(j.usage){
            chats.group[idx].in_tokens = j.usage.prompt_tokens||0;
            chats.group[idx].out_tokens = j.usage.completion_tokens||0;
            chats.group[idx].model_name = j.model || (typeof api !== 'undefined' ? api.model : 'unknown');
            let stats=JSON.parse(localStorage.getItem('api_usage_stats')||'{}');
            let mName=api.model||'unknown';
            if(!stats[mName]) stats[mName]={in:0,out:0};
            stats[mName].in+=chats.group[idx].in_tokens;
            stats[mName].out+=chats.group[idx].out_tokens;
            localStorage.setItem('api_usage_stats',JSON.stringify(stats));
          }
          if(j.choices && j.choices.length > 0){
            chats.group[idx].content+=j.choices[0].delta.content||'';
          }
          render();
        }catch(e){}}}
      }
    }catch(e){chats.group[idx].content='连接失败';render();}

    // 新消息在下方拆分后统一写入 chat_messages（避免重复）
    let fullContent=chats.group[idx].content;
    if(fullContent.includes('|||')){
      let parts=fullContent.split('|||').map(s=>s.trim()).filter(s=>s);
      chats.group.splice(idx,1);
      parts.forEach((part,pi)=>{
        chats.group.splice(idx+pi,0,{role:'ai',content:part,character:c,time:nowTime(),animate:true});
        saveToCloud('group_'+c,'ai',part, chats.group[idx+pi]? (chats.group[idx+pi].thinking||'') + (chats.group[idx+pi].in_tokens?' <!--tokens:'+chats.group[idx+pi].in_tokens+'/'+chats.group[idx+pi].out_tokens+'-->':'') + (chats.group[idx+pi].model_name?' <!--model:'+chats.group[idx+pi].model_name+'-->':'') : '');
      });
      render();
    }else{
      saveToCloud('group_'+c,'ai',fullContent, (chats.group[idx].thinking||'') + (chats.group[idx].in_tokens?' <!--tokens:'+chats.group[idx].in_tokens+'/'+chats.group[idx].out_tokens+'-->':'') + (chats.group[idx].model_name?' <!--model:'+chats.group[idx].model_name+'-->':''));
    }

    localStorage.setItem('home_chats',JSON.stringify(chats));
    groupTypingChar=null;render(); // 群聊：移除"正在输入"指示器

    // === 角色间@互动连锁触发检测 ===
    if(level < MAX_CHAIN){
      for(let id of allChars){
        if(id===c) continue;                  // 不能@自己触发自己
        if(replied.has(id)) continue;         // 每个角色最多回复一次
        if(!prompts[id]) continue;
        if(fullContent.includes('@'+(charNames[id]||''))){
          replied.add(id);
          queue.push({c:id, level:level+1});  // 加入待回复队列，下一轮生成回复（上下文已含触发它的消息）
        }
      }
    }
  }

  // === 群聊随机氛围动作（30%概率，仅前端展示，不存记录、不发API、不影响@互动） ===
  if(Math.random()<0.3){
    let poolChars=Array.from(replied).filter(id=>ambientActions[id]&&ambientActions[id].length);
    if(!poolChars.length) poolChars=allChars.filter(id=>ambientActions[id]&&ambientActions[id].length);
    if(poolChars.length){
      let pick=poolChars[Math.floor(Math.random()*poolChars.length)];
      let acts=ambientActions[pick];
      let act=acts[Math.floor(Math.random()*acts.length)];
      groupAmbient=act.replace(/\{name\}/g, charNames[pick]||pick);
      render();
    }
  }else{
    groupAmbient=null;
  }
}

function pokePoke() {
  let pokes = [
    '👋 {name} 戳了戳你的脸',
    '😘 你戳了戳 {name}，{name} 亲了你一口',
    '🐾 {name} 用爪子拍了拍你的头',
    '💤 {name} 假装没看到……然后偷偷回戳了你',
    '🫣 你戳了戳 {name}，{name} 脸红了',
    '😤 {name} 捏了捏你的脸：不许走',
    '🐺 {name} 把你拉进怀里不让动',
    '💜 {name} 在你额头亲了一下',
    '🫠 你戳了戳 {name}，{name} 整个人软了',
    '👀 {name} 歪头看你：干嘛戳我'
  ];
  let name = charNames[currentChar] || '对方';
  let text = pokes[Math.floor(Math.random() * pokes.length)].replace(/\{name\}/g, name);
  let box = document.getElementById('chatBox');
  let div = document.createElement('div');
  div.style.cssText = 'text-align:center;padding:12px;color:#aaa;font-size:13px;animation:fadeIn 0.3s';
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  setTimeout(() => div.style.opacity = '0.5', 3000);
}

let callActive = false;

const VOLC_WS_URL = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel';

function startCall() {
  if (callActive) { endCall(); return; }
  callActive = true;
  let btn = document.getElementById('callBtn');
  if (btn) { btn.classList.add('calling'); btn.textContent = '📞 挂断'; }
  let overlay = document.createElement('div');
  overlay.id = 'callOverlay';
  overlay.innerHTML = `
    <div class="call-card">
      <div class="call-avatar">🐺</div>
      <div class="call-name">言言</div>
      <div class="call-status" id="callStatus">按住说话</div>
      <div class="call-text" id="callText"></div>
      <button class="call-talk-btn" id="callTalkBtn">🎤 按住说话</button>
      <br><br>
      <button class="call-end-btn" onclick="endCall()">挂断</button>
    </div>
  `;
  document.body.appendChild(overlay);

  let talkBtn = document.getElementById('callTalkBtn');
  talkBtn.addEventListener('mousedown', startRecording);
  talkBtn.addEventListener('mouseup', stopRecording);
  talkBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
  talkBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });
}

async function startRecording() {
  if (!callActive) return;
  audioChunks = [];
  let status = document.getElementById('callStatus');
  if (status) status.textContent = '🎤 在听...';
  let talkBtn = document.getElementById('callTalkBtn');
  if (talkBtn) talkBtn.style.background = '#e74c3c';

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.start();
  } catch(e) {
    if (status) status.textContent = '麦克风不可用';
  }
}

async function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
  let talkBtn = document.getElementById('callTalkBtn');
  if (talkBtn) talkBtn.style.background = '';
  let status = document.getElementById('callStatus');
  if (status) status.textContent = '💭 识别中...';

  mediaRecorder.stop();
  mediaStream.getTracks().forEach(t => t.stop());

  await new Promise(r => { mediaRecorder.onstop = r; });

  let blob = new Blob(audioChunks, { type: 'audio/webm' });
  let text = await transcribeWithVolcano(blob);

  if (!text || !callActive) {
    if (status) status.textContent = '没听清，再说一次';
    setTimeout(() => { if (status && callActive) status.textContent = '按住说话'; }, 2000);
    return;
  }

  let callText = document.getElementById('callText');
  if (callText) callText.textContent = '你: ' + text;
  if (status) status.textContent = '💭 思考中...';

  let reply = await callSendToAI(text);
  if (!callActive) return;

  if (callText) callText.textContent = '言言: ' + reply;
  if (status) status.textContent = '🔊 说话中...';

  await callPlayTTS(reply);
  if (status && callActive) status.textContent = '按住说话';
}

async function transcribeWithVolcano(blob) {
  return new Promise(async (resolve) => {
    try {
      let arrayBuf = await blob.arrayBuffer();
      let base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));

      let ws = new WebSocket(VOLC_WS_URL);
      let result = '';
      let resolved = false;

      ws.onopen = () => {
        // 发送配置帧
        ws.send(JSON.stringify({
          header: {
            appid: VOLC_APP_ID,
            token: VOLC_TOKEN,
            namespace: 'SeedASR',
            name: 'StartTranscription'
          },
          payload: {
            uid: 'xuanxuan',
            format: 'opus',
            sample_rate: 48000,
            language: 'zh',
            enable_itn: true,
            enable_punctuation: true,
            resource_id: 'volc.seedasr.sauc.duration'
          }
        }));

        // 发送音频数据
        ws.send(JSON.stringify({
          header: {
            appid: VOLC_APP_ID,
            namespace: 'SeedASR',
            name: 'AudioData'
          },
          payload: {
            audio: base64,
            is_last: true
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          let data = JSON.parse(event.data);
          if (data.payload && data.payload.text) {
            result = data.payload.text;
          }
          if (data.header && (data.header.name === 'TranscriptionCompleted' || data.header.name === 'SentenceEnd')) {
            if (!resolved) { resolved = true; ws.close(); resolve(result); }
          }
        } catch(e) {}
      };

      ws.onerror = () => { if (!resolved) { resolved = true; resolve(''); } };
      ws.onclose = () => { if (!resolved) { resolved = true; resolve(result); } };

      setTimeout(() => { if (!resolved) { resolved = true; ws.close(); resolve(result); } }, 8000);
    } catch(e) {
      resolve('');
    }
  });
}

async function callSendToAI(text) {
  let char = currentChar || 'yan';
  let msgs = [];
  if (prompts[char]) msgs.push({role:'system', content: prompts[char] + '\n当前真实时间：' + aiNowTime() + '。用户在跟你打电话语音聊天，回复简短口语化，像真的在打电话一样，不要太长，1-3句话就好。'});
  let history = (chats[char] || []).slice(-10);
  history.forEach(m => msgs.push({role: m.role, content: m.content}));
  msgs.push({role:'user', content: text});
  if (!chats[char]) chats[char] = [];
  chats[char].push({role:'user', content: text, time: nowTime()});
  try {
    let api = getApiForChar(char);
   let res = await fetch(api.url + '/chat/completions', {
     method: 'POST',
     headers: {'Content-Type':'application/json', 'Authorization':'Bearer ' + api.key},
     body: JSON.stringify({ model: api.model || 'claude-sonnet-4-20250514', messages: msgs, max_tokens: 200 })
   });
    let data = await res.json();
    let reply = data.choices[0].message.content;
    chats[char].push({role:'assistant', content: reply, time: nowTime()});
    render();
    return reply;
  } catch(e) {
    return '信号不好，没听清，再说一次？';
  }
}

async function callPlayTTS(text) {
  let ttsUrl = 'https://pnymorkpnizvpqdquihh.supabase.co/functions/v1/daddy-voice';
  try {
    let res = await fetch(ttsUrl, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text: text})
    });
    if (!res.ok) {
      let u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      return new Promise(r => { u.onend = r; speechSynthesis.speak(u); });
    }
    let blob = await res.blob();
    let url = URL.createObjectURL(blob);
    callAudio = new Audio(url);
    return new Promise(r => { callAudio.onended = r; callAudio.play(); });
  } catch(e) {
    let u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    return new Promise(r => { u.onend = r; speechSynthesis.speak(u); });
  }
}

function endCall() {
  callActive = false;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') { try { mediaRecorder.stop(); } catch(e){} }
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); }
  if (callAudio) { try { callAudio.pause(); } catch(e){} }
  let overlay = document.getElementById('callOverlay');
  if (overlay) overlay.remove();
  let btn = document.getElementById('callBtn');
  if (btn) { btn.classList.remove('calling'); btn.textContent = '📞'; }
}

function updateChatModelLabel(){let el=document.getElementById('chatModel');if(!el)return;let preset=localStorage.getItem('preset_'+currentChar);let model=localStorage.getItem('model_'+currentChar);let parts=[];if(preset)parts.push(preset);if(model)parts.push(model);el.textContent=parts.length?parts.join(' · '):'未设置';}

function enterChat(id){currentChar=id;document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('chatView').classList.add('active');document.getElementById('chatName').textContent=charNames[id]||'';updateChatModelLabel();document.getElementById('tabBar').style.display='none';if(id==='group'){chats.group=[];loadCloudChat('group');return;}chats[id]=[];chatOffset[id]=0;loadCloudChat(id);}
// @选人弹窗
function initAtPicker(){
  let input=document.getElementById('input');
  if(!input)return;
  let picker=document.createElement('div');
  picker.id='atPicker';
  picker.style.cssText='display:none;position:absolute;bottom:100%;left:0;right:0;background:#2a2a3e;border-radius:12px;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:999';
  let chars=['yan','peiji','shenyan','axun','jiangsu','su','zouzheng','keke'];
  chars.forEach(id=>{
    let btn=document.createElement('div');
    btn.style.cssText='padding:10px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;color:#eee';
    btn.innerHTML='<span style="width:26px;height:26px;border-radius:50%;background:'+(avatarColors[id]||'#555')+';display:inline-flex;align-items:center;justify-content:center;font-size:13px">'+(avatarEmoji[id]||'?')+'</span><span>'+(charNames[id]||id)+'</span>';
    btn.onmouseenter=()=>btn.style.background='rgba(155,89,182,0.2)';
    btn.onmouseleave=()=>btn.style.background='none';
    btn.onclick=()=>{
      let val=input.value;
      let atIdx=val.lastIndexOf('@');
      input.value=val.slice(0,atIdx)+'@'+charNames[id]+' ';
      picker.style.display='none';
      input.focus();
    };
    picker.appendChild(btn);
  });
  let allBtn=document.createElement('div');
  allBtn.style.cssText='padding:10px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;color:#eee;border-top:1px solid rgba(255,255,255,0.1);margin-top:4px';
  allBtn.innerHTML='<span style="width:26px;height:26px;border-radius:50%;background:#e74c3c;display:inline-flex;align-items:center;justify-content:center;font-size:13px">📢</span><span>全体</span>';
  allBtn.onmouseenter=()=>allBtn.style.background='rgba(155,89,182,0.2)';
  allBtn.onmouseleave=()=>allBtn.style.background='none';
  allBtn.onclick=()=>{
    let val=input.value;
    let atIdx=val.lastIndexOf('@');
    input.value=val.slice(0,atIdx)+'@全体 ';
    picker.style.display='none';
    input.focus();
  };
  picker.appendChild(allBtn);
  input.parentElement.style.position='relative';
  input.parentElement.appendChild(picker);
  input.addEventListener('input',()=>{
    if(currentChar!=='group'){picker.style.display='none';return;}
    let val=input.value;
    let atIdx=val.lastIndexOf('@');
    if(atIdx>=0&&(atIdx===val.length-1||!val.slice(atIdx+1).includes(' '))){
      picker.style.display='block';
    }else{picker.style.display='none';}
  });
  document.addEventListener('click',(e)=>{
    if(!picker.contains(e.target)&&e.target!==input)picker.style.display='none';
  });
}
setTimeout(initAtPicker,1000);
function quoteMsg(idx){
  let m=chats[currentChar][idx];
  let isGroup = currentChar === 'group';
  let charKey = m.role === 'user' ? 'user' : (isGroup ? m.character : currentChar);
  let sender = m.role === 'user' ? '你' : (charNames[charKey] || charKey);
  let content = m.content || '';
  // 存完整内容用于发送，预览只显示50字符
  window.quoteMsgData={sender:sender,text:content};
  showQuotePreview();
  document.getElementById('input').focus();
}

function showQuotePreview(){
  let box=document.getElementById('quotePreview');
  if(!box){
    box=document.createElement('div');
    box.id='quotePreview';
    box.style.cssText='display:none;position:fixed;bottom:60px;left:0;right:0;width:100%;max-width:100vw;box-sizing:border-box;padding:8px 30px 8px 12px;background:rgba(155,89,182,0.2);border-top:1px solid #9b59b6;z-index:100;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;';
    let inputArea=document.querySelector('.input-area');
    let wrapper=document.createElement('div');
    wrapper.style.cssText='display:flex;flex-direction:column;flex:1;gap:6px';
    let textarea=inputArea.querySelector('textarea');
    inputArea.insertBefore(wrapper,textarea);
    wrapper.appendChild(box);
    wrapper.appendChild(textarea);
  }
  let preview=window.quoteMsgData.text.length>50?window.quoteMsgData.text.slice(0,50)+'...':window.quoteMsgData.text;
  box.innerHTML='<div style="padding-right:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><strong>'+window.quoteMsgData.sender+'</strong>: '+preview+'</div><span onclick="window.quoteMsgData=null;document.getElementById(\'quotePreview\').style.display=\'none\'" style="position:absolute;right:6px;top:4px;cursor:pointer;font-size:14px;color:#e74c3c">✕</span>';
  box.style.display='block';
}
