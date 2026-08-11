function openProfile(charId){let p=charProfiles[charId]||defaultProfiles[charId]||{};document.getElementById('profileModal').style.display='flex';document.getElementById('profileModal').dataset.charId=charId;document.getElementById('profileAvatar').textContent=avatarEmoji[charId]||'?';document.getElementById('profileAvatar').style.background=avatarColors[charId]||'#555';document.getElementById('profileName').textContent=charNames[charId]||'';document.getElementById('profileBio').textContent=p.bio||'';document.getElementById('profileRelation').textContent=p.relation||'';document.getElementById('profileStatus').textContent=p.status||'在线';document.getElementById('profileCtx').textContent=(p.ctxCount||localStorage.getItem('ctx_count')||30)+'条';let tagsDiv=document.getElementById('profileTags');tagsDiv.innerHTML='';(p.tags||[]).forEach(t=>{let s=document.createElement('span');s.textContent=t;tagsDiv.appendChild(s);});}

function editProfile(){alert('编辑功能开发中～');}

function toggleTheme(){
  document.body.classList.toggle('warm');
  let isWarm=document.body.classList.contains('warm');
  localStorage.setItem('theme',isWarm?'warm':'cold');
  document.getElementById('themeBtn').textContent=isWarm?'切换冷色主题 🌙':'切换暖色主题 🌅';
}

function showImgPreview(src){
  let overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer';
  let img=document.createElement('img');
  img.src=src;
  img.style.cssText='max-width:90%;max-height:90%;border-radius:8px;object-fit:contain';
  overlay.appendChild(img);
  overlay.onclick=()=>overlay.remove();
  document.body.appendChild(overlay);
}

function toggleSearch(){let bar=document.getElementById('searchBar');bar.style.display=bar.style.display==='none'?'block':'none';if(bar.style.display==='none'){document.getElementById('searchInput').value='';render();}else{let si=document.getElementById('searchInput');if(si&&!si.value.trim())renderSearchHistory();}}

function openSettings(){
  document.getElementById('apiUrl').value=apiConfig.url||'';
  document.getElementById('apiKey').value=apiConfig.key||'';
  document.getElementById('supaUrl').value=SUPA_URL||'';
  document.getElementById('supaKey').value=SUPA_KEY||'';
  let sel=document.getElementById('modelName');
  if(apiConfig.model&&sel.options.length<=1){sel.innerHTML='<option value="'+apiConfig.model+'">'+apiConfig.model+'</option>';}
  if(apiConfig.model)sel.value=apiConfig.model;
  editingPromptChar=currentChar&&currentChar!=='group'?currentChar:'yan';
  let tabs=document.getElementById('charTabs');tabs.innerHTML='';
  characters.filter(c=>c.id!=='group').forEach(c=>{
    let t=document.createElement('div');
    t.className='char-tab'+(c.id===editingPromptChar?' active':'');
    t.textContent=c.name;
    t.onclick=()=>switchPromptTab(c.id);
    tabs.appendChild(t);
  });
  document.getElementById('sysPrompt').value=prompts[editingPromptChar]||'';
  document.getElementById('settingsModal').classList.add('show');
}

function openSettings(){
  let cv=localStorage.getItem('ctx_count')||'30';document.getElementById('ctxRange').value=cv;document.getElementById('ctxVal').textContent=cv;
  document.getElementById('apiUrl').value=apiConfig.url||'';
  document.getElementById('apiKey').value=apiConfig.key||'';
  document.getElementById('supaUrl').value=SUPA_URL||'';
  document.getElementById('supaKey').value=SUPA_KEY||'';
  let sel=document.getElementById('modelName');
  if(apiConfig.model&&sel.options.length<=1){sel.innerHTML='<option value="'+apiConfig.model+'">'+apiConfig.model+'</option>';}
  if(apiConfig.model)sel.value=apiConfig.model;
  editingPromptChar=currentChar&&currentChar!=='group'?currentChar:'yan';
  let tabs=document.getElementById('charTabs');tabs.innerHTML='';
  characters.filter(c=>c.id!=='group').forEach(c=>{
    let t=document.createElement('div');
    t.className='char-tab'+(c.id===editingPromptChar?' active':'');
    t.textContent=c.name;
    t.onclick=()=>switchPromptTab(c.id);
    tabs.appendChild(t);
  });
  document.getElementById('sysPrompt').value=prompts[editingPromptChar]||'';
  document.getElementById('settingsModal').classList.add('show');
}

function closeSettings(){document.getElementById('settingsModal').classList.remove('show');}

function togglePlusMenu(){let m=document.getElementById('plusMenu');m.style.display=m.style.display==='none'?'block':'none';}

function takePhoto(){document.getElementById('imgPicker').setAttribute('capture','environment');document.getElementById('imgPicker').click();setTimeout(()=>document.getElementById('imgPicker').removeAttribute('capture'),100);}

function showReactPick(idx){let old=document.getElementById('reactMenu');if(old)old.remove();let menu=document.createElement('div');menu.id='reactMenu';menu.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a2e;border:1px solid #444;border-radius:20px;padding:12px 16px;display:flex;gap:12px;z-index:999';['❤️','😂','👍','🥺','🦊'].forEach(em=>{let s=document.createElement('span');s.textContent=em;s.style.cssText='font-size:24px;cursor:pointer';s.onclick=()=>{addReact(idx,em);menu.remove();};menu.appendChild(s);});document.body.appendChild(menu);document.querySelectorAll('.msg-menu').forEach(x=>x.remove());}

function showReactMenu(e,idx){let old=document.getElementById('reactMenu');if(old)old.remove();let menu=document.createElement('div');menu.id='reactMenu';menu.style.cssText='position:fixed;top:'+(e.clientY-50)+'px;left:'+(e.clientX-60)+'px;background:#1a1a2e;border:1px solid #444;border-radius:20px;padding:6px 10px;display:flex;gap:8px;z-index:999';['❤️','😂','👍','🥺','🦊'].forEach(em=>{let s=document.createElement('span');s.textContent=em;s.style.cssText='font-size:20px;cursor:pointer';s.onclick=()=>{addReact(idx,em);menu.remove();};menu.appendChild(s);});document.body.appendChild(menu);setTimeout(()=>{document.addEventListener('click',()=>{menu.remove();},{once:true});},10);}

function addReact(idx,emoji){if(!chats[currentChar][idx].reactions)chats[currentChar][idx].reactions=[];chats[currentChar][idx].reactions.push(emoji);localStorage.setItem('home_chats',JSON.stringify(chats));render();}

function setStatus(s){let id=document.getElementById('profileModal').dataset.charId;if(!id)return;localStorage.setItem('status_'+id,s);let statusText={'online':'在线','busy':'忙碌中','sleep':'睡了','away':'离开'}[s];document.getElementById('profileStatus').textContent=statusText;document.getElementById('profileModal').style.display='none';let bar=document.getElementById('avatarBar');if(bar){bar.innerHTML='';characters.forEach(c=>{let d=document.createElement('div');d.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;min-width:60px;flex-shrink:0';d.onclick=function(){openProfile(c.id);};let status=localStorage.getItem('status_'+c.id)||'online';let statusText={'online':'在线','busy':'忙碌中','sleep':'睡了','away':'离开'}[status];let statusClass='status-'+status;d.innerHTML='<div style="width:48px;height:48px;border-radius:50%;background:'+c.color+';display:flex;align-items:center;justify-content:center;font-size:22px">'+c.emoji+'</div><span style="font-size:11px;color:#aaa">'+c.name+'</span><span class="status-tag '+statusClass+'">'+statusText+'</span>';bar.appendChild(d);});}}

async function showModelPicker(){
  let old=document.getElementById('modelPickerModal');if(old)old.remove();
  let modal=document.createElement('div');modal.id='modelPickerModal';
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999';
  modal.onclick=e=>{if(e.target===modal)modal.remove();};
  let current=apiConfig.model||'';
  modal.innerHTML='<div style="background:#16213e;border-radius:16px;padding:20px;width:85%;max-width:320px"><div style="color:#fff;font-size:16px;margin-bottom:12px">🔄 切换模型</div><div style="color:#888;font-size:13px">加载中...</div></div>';
  document.body.appendChild(modal);
  try{
    let res=await fetch(apiConfig.url+'/models',{headers:{'Authorization':'Bearer '+apiConfig.key}});
    let data=await res.json();
    let models=data.data||data;
    let html='<div style="background:#16213e;border-radius:16px;padding:20px;width:85%;max-width:320px;max-height:70vh;overflow-y:auto"><div style="color:#fff;font-size:16px;margin-bottom:8px">🔄 切换模型</div><div style="color:#888;font-size:12px;margin-bottom:12px">当前: '+current+'</div>';
    models.forEach(m=>{
      let id=m.id||m;
      let active=id===current?'background:#9b59b6;color:#fff':'background:#0f3460;color:#aaa';
      html+='<div class="model-opt" data-model="'+id.replace(/"/g,'&quot;')+'" style="padding:10px 14px;margin:6px 0;border-radius:10px;cursor:pointer;font-size:13px;'+active+'">'+id+'</div>';
    });
    html+='</div>';
    modal.innerHTML=html;
    modal.querySelectorAll('.model-opt').forEach(el=>{el.onclick=()=>{apiConfig.model=el.dataset.model;localStorage.setItem('api_model',el.dataset.model);modal.remove();togglePlusMenu();};});
  }catch(e){
    modal.innerHTML='<div style="background:#16213e;border-radius:16px;padding:20px;width:85%;max-width:320px"><div style="color:#fff;font-size:16px;margin-bottom:12px">🔄 切换模型</div><div style="color:#f66;font-size:13px">加载失败: '+e.message+'</div></div>';
  }
}