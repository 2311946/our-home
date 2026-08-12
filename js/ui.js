
let currentToast = null;
function showToast(msg, duration = 2000) {
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }
  let toast = document.createElement('div');
  toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#1a1a2e; color:#fff; padding:10px 20px; border-radius:12px; font-size:13px; z-index:10000; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition: opacity 0.3s, top 0.3s; opacity:0;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.top = '40px';
  }, 10);
  
  currentToast = toast;
  
  setTimeout(() => {
    if (currentToast === toast) {
      toast.style.opacity = '0';
      toast.style.top = '20px';
      setTimeout(() => { if(toast.parentNode) toast.remove(); }, 300);
    }
  }, duration);
}

function openProfile(charId){
  let p=charProfiles[charId]||defaultProfiles[charId]||{};
  // 如果是宣宣，读取 localStorage 中的自定义资料
  if(charId==='xuanxuan'){
    let userProfile=JSON.parse(localStorage.getItem('user_profile')||'{}');
    if(userProfile.name) charNames.xuanxuan=userProfile.name;
    if(userProfile.bio) p=Object.assign({},p,{bio:userProfile.bio});
    if(userProfile.mood) p=Object.assign({},p,{mood:userProfile.mood});
  }
  document.getElementById('profileModal').style.display='flex';
  document.getElementById('profileModal').dataset.charId=charId;
  document.getElementById('profileAvatar').textContent=avatarEmoji[charId]||'?';
  document.getElementById('profileAvatar').style.background=avatarColors[charId]||'#555';
  document.getElementById('profileName').textContent=charNames[charId]||'';
  document.getElementById('profileBio').textContent=p.bio||'';
  document.getElementById('profileRelation').textContent=p.relation||'';
  document.getElementById('profileStatus').textContent=p.status||'在线';
  document.getElementById('profileCtx').textContent=(p.ctxCount||localStorage.getItem('ctx_count')||30)+'条';
  // 心情状态
  let moodEl=document.getElementById('profileMood');
  if(moodEl){ moodEl.textContent=p.mood||''; moodEl.style.display=p.mood?'block':'none'; }
  // rua统计（仅宣宣）
  let ruaRow=document.getElementById('profileRuaRow');
  let ruaBtn=document.getElementById('ruaBtn');
  if(charId==='xuanxuan'){
    let today=new Date().toISOString().slice(0,10);
    let ruaCount=parseInt(localStorage.getItem('rua_today_'+today)||'0');
    ruaRow.style.display='flex';
    document.getElementById('profileRuaCount').textContent=ruaCount+'次 🐾';
    ruaBtn.style.display='block';
  } else {
    ruaRow.style.display='none';
    ruaBtn.style.display='none';
  }
  let tagsDiv=document.getElementById('profileTags');
  tagsDiv.innerHTML='';
  (p.tags||[]).forEach(t=>{let s=document.createElement('span');s.textContent=t;tagsDiv.appendChild(s);});
}

function editProfile(){
  let charId=document.getElementById('profileModal').dataset.charId;
  if(charId!=='xuanxuan'){ alert('只能编辑自己的名片哦～'); return; }
  let userProfile=JSON.parse(localStorage.getItem('user_profile')||'{}');
  let oldName=userProfile.name||charNames.xuanxuan||'宣宣';
  let oldBio=userProfile.bio||defaultProfiles.xuanxuan.bio||'';
  let oldMood=userProfile.mood||'';
  // 创建编辑弹窗
  let overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001';
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
  overlay.innerHTML=`
    <div style="background:#16213e;border-radius:16px;padding:24px;width:85%;max-width:300px;">
      <div style="color:#fff;font-size:16px;margin-bottom:16px;text-align:center">✏️ 编辑我的名片</div>
      <div style="margin-bottom:12px">
        <div style="color:#888;font-size:12px;margin-bottom:4px">昵称</div>
        <input id="editName" value="${oldName.replace(/"/g,'&quot;')}" style="width:100%;padding:8px 12px;background:#253554;color:#eee;border:1px solid #444;border-radius:8px;outline:none;box-sizing:border-box" />
      </div>
      <div style="margin-bottom:12px">
        <div style="color:#888;font-size:12px;margin-bottom:4px">简介</div>
        <input id="editBio" value="${oldBio.replace(/"/g,'&quot;')}" style="width:100%;padding:8px 12px;background:#253554;color:#eee;border:1px solid #444;border-radius:8px;outline:none;box-sizing:border-box" />
      </div>
      <div style="margin-bottom:16px">
        <div style="color:#888;font-size:12px;margin-bottom:4px">心情状态</div>
        <input id="editMood" value="${oldMood.replace(/"/g,'&quot;')}" placeholder="今天的心情..." style="width:100%;padding:8px 12px;background:#253554;color:#eee;border:1px solid #444;border-radius:8px;outline:none;box-sizing:border-box" />
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="this.closest('div[style]').parentElement.remove()" style="flex:1;padding:10px;border:none;border-radius:10px;background:#253554;color:#aaa;cursor:pointer">取消</button>
        <button onclick="saveProfile()" style="flex:1;padding:10px;border:none;border-radius:10px;background:#9b59b6;color:#fff;cursor:pointer">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveProfile(){
  let name=document.getElementById('editName').value.trim();
  let bio=document.getElementById('editBio').value.trim();
  let mood=document.getElementById('editMood').value.trim();
  let userProfile={name:name||'宣宣',bio:bio||'被宠爱的小宝贝',mood:mood};
  localStorage.setItem('user_profile',JSON.stringify(userProfile));
  charNames.xuanxuan=userProfile.name;
  // 关闭编辑弹窗并刷新名片
  document.querySelectorAll('div[style*="z-index:10001"]').forEach(el=>el.remove());
  openProfile('xuanxuan');
  showToast('名片已更新 💕');
}

function ruaXuanxuan(){
  let today=new Date().toISOString().slice(0,10);
  let key='rua_today_'+today;
  let count=parseInt(localStorage.getItem(key)||'0')+1;
  localStorage.setItem(key,count.toString());
  // 更新显示
  document.getElementById('profileRuaCount').textContent=count+'次 🐾';
  // 随机反馈文字
  let reactions=['呀！','别闹~','嘿嘿♡','好舒服~','再来！','哼！','喵~','嗯哼♡'];
  let reaction=reactions[Math.floor(Math.random()*reactions.length)];
  showToast(reaction);
  // 头像抖动动画
  let avatar=document.getElementById('profileAvatar');
  avatar.classList.add('rua-shake');
  setTimeout(()=>avatar.classList.remove('rua-shake'),500);
  // 飘出爱心动画
  for(let i=0;i<3;i++){
    setTimeout(()=>{
      let heart=document.createElement('div');
      heart.className='rua-heart';
      heart.textContent='❤️';
      heart.style.left=(30+Math.random()*40)+'%';
      heart.style.animationDelay=(i*0.15)+'s';
      let card=document.querySelector('.profile-card');
      card.style.position='relative';
      card.appendChild(heart);
      setTimeout(()=>heart.remove(),1200);
    },i*100);
  }
}

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

// 打开搜索栏并聚焦输入框（补充 plus 菜单 🔍 按钮缺失的实现）
function searchChat(){let bar=document.getElementById('searchBar');bar.style.display='block';let si=document.getElementById('searchInput');if(si){si.focus();if(!si.value.trim())renderSearchHistory();}}

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
  renderApiUsage(); document.getElementById('settingsModal').classList.add('show');
}

function closeSettings(){document.getElementById('settingsModal').classList.remove('show');}

function togglePlusMenu(){let m=document.getElementById('plusMenu');m.style.display=m.style.display==='none'?'block':'none';}

function takePhoto(){document.getElementById('imgPicker').setAttribute('capture','environment');document.getElementById('imgPicker').click();setTimeout(()=>document.getElementById('imgPicker').removeAttribute('capture'),100);}

function showReactPick(idx){let old=document.getElementById('reactMenu');if(old)old.remove();let menu=document.createElement('div');menu.id='reactMenu';menu.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a2e;border:1px solid #444;border-radius:20px;padding:12px 16px;display:flex;gap:12px;z-index:999';['❤️','😂','👍','🥺','🦊'].forEach(em=>{let s=document.createElement('span');s.textContent=em;s.style.cssText='font-size:24px;cursor:pointer';s.onclick=()=>{addReact(idx,em);menu.remove();};menu.appendChild(s);});document.body.appendChild(menu);document.querySelectorAll('.msg-menu').forEach(x=>x.remove());}

function showReactMenu(e,idx){let old=document.getElementById('reactMenu');if(old)old.remove();let menu=document.createElement('div');menu.id='reactMenu';menu.style.cssText='position:fixed;top:'+(e.clientY-50)+'px;left:'+(e.clientX-60)+'px;background:#1a1a2e;border:1px solid #444;border-radius:20px;padding:6px 10px;display:flex;gap:8px;z-index:999';['❤️','😂','👍','🥺','🦊'].forEach(em=>{let s=document.createElement('span');s.textContent=em;s.style.cssText='font-size:20px;cursor:pointer';s.onclick=()=>{addReact(idx,em);menu.remove();};menu.appendChild(s);});document.body.appendChild(menu);setTimeout(()=>{document.addEventListener('click',()=>{menu.remove();},{once:true});},10);}

function addReact(idx,emoji){if(!chats[currentChar][idx].reactions)chats[currentChar][idx].reactions=[];chats[currentChar][idx].reactions.push(emoji);localStorage.setItem('home_chats',JSON.stringify(chats));render();}

function setStatus(s){
  let id=document.getElementById('profileModal').dataset.charId;
  if(!id)return;
  localStorage.setItem('status_'+id,s);
  let statusText={'online':'在线','busy':'忙碌中','sleep':'睡了','away':'离开'}[s];
  document.getElementById('profileStatus').textContent=statusText;
  showToast('状态已更新');
  document.getElementById('profileModal').style.display='none';
  let bar=document.getElementById('avatarBar');
  if(bar){
    bar.innerHTML='';
    let allChars = [...characters, {id:'xuanxuan', name:'宣宣', emoji:'💕', color:'#e91e63'}];
    allChars.forEach(c=>{
      if(c.id==='group') return;
      let d=document.createElement('div');
      d.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;min-width:60px;flex-shrink:0';
      d.onclick=function(){openProfile(c.id);};
      let status=localStorage.getItem('status_'+c.id)||'online';
      let statusText={'online':'在线','busy':'忙碌中','sleep':'睡了','away':'离开'}[status];
      let statusClass='status-'+status;
      d.innerHTML='<div style="width:48px;height:48px;border-radius:50%;background:'+c.color+';display:flex;align-items:center;justify-content:center;font-size:22px">'+c.emoji+'</div><span style="font-size:11px;color:#aaa">'+c.name+'</span><span class="status-tag '+statusClass+'">'+statusText+'</span>';
      bar.appendChild(d);
    });
  }
}

// 打开当前角色名片以设置状态（补充 plus 菜单 🎭 按钮缺失的实现）
function showStatusPicker(){openProfile(currentChar);}

async function showModelPicker(){
  let old=document.getElementById('modelPickerModal');if(old)old.remove();
  let modal=document.createElement('div');modal.id='modelPickerModal';
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999';
  modal.onclick=e=>{if(e.target===modal)modal.remove();};
  
  let currentPreset=localStorage.getItem('preset_'+currentChar)||localStorage.getItem('current_preset')||'';
  let currentModel=localStorage.getItem('model_'+currentChar)||apiConfig.model||'';
  
  let presets=JSON.parse(localStorage.getItem('api_presets')||'{}');
  let presetOptions = '<option value="">-- 全局默认 API --</option>';
  Object.keys(presets).forEach(name=>{
    let sel = name===currentPreset ? 'selected' : '';
    presetOptions += `<option value="${name}" ${sel}>${name}</option>`;
  });

  let html=`
  <div style="background:#16213e;border-radius:16px;padding:20px;width:85%;max-width:320px;max-height:80vh;display:flex;flex-direction:column;">
    <div style="color:#fff;font-size:16px;margin-bottom:12px;text-align:center;">🔄 为 ${charNames[currentChar]||'此角色'} 设置模型</div>
    
    <div style="margin-bottom:12px;">
      <div style="color:#888;font-size:12px;margin-bottom:4px;">1. 选择预设 (接口通道)</div>
      <select id="pickerPresetSel" style="width:100%;padding:8px;background:#253554;color:#eee;border:1px solid #444;border-radius:8px;outline:none;">
        ${presetOptions}
      </select>
    </div>
    
    <div style="color:#888;font-size:12px;margin-bottom:4px;">2. 选择模型名称</div>
    <div id="pickerModelList" style="flex:1;overflow-y:auto;background:#0f172a;border-radius:8px;padding:8px;min-height:150px;">
      <div style="color:#888;font-size:13px;text-align:center;margin-top:20px;">加载中...</div>
    </div>
  </div>`;
  
  modal.innerHTML=html;
  document.body.appendChild(modal);
  
  let selEl = document.getElementById('pickerPresetSel');
  let listEl = document.getElementById('pickerModelList');
  
  async function loadModelsForPreset(presetName) {
    let url = apiConfig.url;
    let key = apiConfig.key;
    if(presetName && presets[presetName]) {
      url = presets[presetName].url;
      key = presets[presetName].key;
    }
    url = url.replace(/\/$/, '');
    
    if(!url || !key) {
      listEl.innerHTML = '<div style="color:#e74c3c;font-size:13px;text-align:center;margin-top:20px;">请先在设置中配置 API 地址和 Key</div>';
      return;
    }
    
    listEl.innerHTML = '<div style="color:#888;font-size:13px;text-align:center;margin-top:20px;">加载中...</div>';
    try {
      let res = await fetch(url+'/models',{headers:{'Authorization':'Bearer '+key}});
      if(!res.ok) throw new Error('API 请求失败');
      let data = await res.json();
      let models = data.data||data;
      if(!models || !models.length) throw new Error('未获取到模型列表');
      
      let listHtml = '';
      models.forEach(m=>{
        let id = m.id||m;
        let active = id===currentModel ? 'background:#9b59b6;color:#fff' : 'background:#253554;color:#aaa';
        listHtml += `<div class="model-opt" data-model="${id.replace(/"/g,'&quot;')}" style="padding:10px 14px;margin:6px 0;border-radius:8px;cursor:pointer;font-size:13px;${active}">${id}</div>`;
      });
      listEl.innerHTML = listHtml;
      
      listEl.querySelectorAll('.model-opt').forEach(el=>{
        el.onclick = () => {
          let chosenModel = el.dataset.model;
          localStorage.setItem('preset_'+currentChar, selEl.value);
          localStorage.setItem('model_'+currentChar, chosenModel);
          modal.remove();
          togglePlusMenu();
          showToast('已切换: ' + chosenModel);
        };
      });
    } catch(e) {
      listEl.innerHTML = `<div style="color:#e74c3c;font-size:13px;text-align:center;margin-top:20px;">加载失败:\n${e.message}</div>`;
    }
  }
  
  selEl.onchange = () => loadModelsForPreset(selEl.value);
  loadModelsForPreset(selEl.value);
}

function renderApiUsage() {
  let list = document.getElementById('apiUsageList');
  if(!list) return;
  let stats = JSON.parse(localStorage.getItem('api_usage_stats')||'{}');
  let html = '';
  let totalIn = 0, totalOut = 0;
  for(let m in stats) {
    html += `<div style="display:flex;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:4px;">
      <span style="color:#9b59b6">${m}</span>
      <span>${stats[m].in} ⬆ / ${stats[m].out} ⬇</span>
    </div>`;
    totalIn += stats[m].in;
    totalOut += stats[m].out;
  }
  if(!html) {
    list.innerHTML = '暂无用量记录';
  } else {
    list.innerHTML = `<div style="color:#fff;font-weight:bold;margin-bottom:8px;">总计: ${totalIn} ⬆ / ${totalOut} ⬇</div>` + html;
  }
}
function clearUsageStats() {
  if(confirm('确定清除所有用量统计吗？')) {
    localStorage.removeItem('api_usage_stats');
    renderApiUsage();
  }
}

// === 角色独立设置面板 ===
var _csCharId='';
function openCharSettings(charId){
  if(!charId)return;
  _csCharId=charId;
  let old=document.getElementById('charSettingsModal');
  if(old)old.remove();

  let currentModel=localStorage.getItem('model_'+charId)||apiConfig.model||'';
  let currentPreset=localStorage.getItem('preset_'+charId)||'';
  let ctxCount=localStorage.getItem('ctx_count_'+charId)||localStorage.getItem('ctx_count')||'30';
  let groupCtx=localStorage.getItem('group_ctx_'+charId)==='true';
  let groupCtxCount=localStorage.getItem('group_ctx_count_'+charId)||'10';

  let presets=JSON.parse(localStorage.getItem('api_presets')||'{}');
  let presetOptions='<option value="">-- 全局默认 API --</option>';
  Object.keys(presets).forEach(name=>{
    presetOptions+='<option value="'+name+'"'+(name===currentPreset?' selected':'')+'>'+name+'</option>';
  });

  let overlay=document.createElement('div');
  overlay.id='charSettingsModal';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:10000';
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};

  let card=document.createElement('div');
  card.style.cssText='background:#16213e;border-radius:16px;padding:20px;width:90%;max-width:340px;max-height:80vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.5)';

  card.innerHTML='<span onclick="document.getElementById(\'charSettingsModal\').remove()" style="position:absolute;right:14px;top:10px;cursor:pointer;font-size:18px;color:#e74c3c">✕</span>'+
    '<div style="color:#fff;font-size:16px;margin-bottom:16px;text-align:center">⚙️ '+(charNames[charId]||charId)+' 的设置</div>'+
    '<div style="margin-bottom:14px">'+
      '<div style="color:#9b59b6;font-size:13px;margin-bottom:6px">🤖 模型选择</div>'+
      '<select id="csPresetSel" style="width:100%;padding:8px;background:#253554;color:#eee;border:1px solid #444;border-radius:8px;outline:none;margin-bottom:8px">'+presetOptions+'</select>'+
      '<div id="csModelList" style="background:#0f172a;border-radius:8px;padding:8px;max-height:150px;overflow-y:auto"><div style="color:#888;font-size:13px;text-align:center;padding:12px">点击加载模型列表...</div></div>'+
      '<div style="margin-top:4px;font-size:11px;color:#666">当前: <span id="csCurrentModel">'+(currentModel||'全局默认')+'</span></div>'+
    '</div>'+
    '<div style="margin-bottom:14px">'+
      '<div style="color:#9b59b6;font-size:13px;margin-bottom:6px">📝 人设 Prompt</div>'+
      '<textarea id="csPrompt" rows="5" style="width:100%;padding:8px 12px;background:#253554;color:#eee;border:1px solid #444;border-radius:8px;outline:none;box-sizing:border-box;font-size:13px;resize:vertical;line-height:1.5"></textarea>'+
    '</div>'+
    '<div style="margin-bottom:18px;padding:12px 14px;background:#0f172a;border-radius:10px">'+
      '<div style="color:#9b59b6;font-size:14px;margin-bottom:10px;font-weight:500">📊 上下文条数: <span id="csCtxVal" style="color:#fff;font-size:16px;font-weight:700">'+ctxCount+'</span> 条</div>'+
      '<input id="csCtxRange" type="range" min="10" max="300" step="10" value="'+ctxCount+'" oninput="document.getElementById(\'csCtxVal\').textContent=this.value" style="width:100%;height:6px;accent-color:#9b59b6" />'+
      '<div style="display:flex;justify-content:space-between;color:#666;font-size:11px;margin-top:4px"><span>10</span><span>100</span><span>200</span><span>300</span></div>'+
    '</div>'+
    '<div style="margin-bottom:18px;padding:12px 14px;background:#0f172a;border-radius:10px">'+
      '<div style="color:#9b59b6;font-size:14px;margin-bottom:10px;font-weight:500">💬 带入群聊记录</div>'+
      '<div style="display:flex;align-items:center;gap:16px">'+
        '<label style="display:flex;align-items:center;gap:8px;color:#eee;font-size:14px;cursor:pointer">'+
          '<input id="csGroupCtx" type="checkbox" '+(groupCtx?'checked':'')+' style="accent-color:#9b59b6;width:18px;height:18px" /> 启用'+
        '</label>'+
        '<select id="csGroupCtxCount" style="padding:6px 12px;background:#253554;color:#eee;border:1px solid #444;border-radius:8px;font-size:13px;outline:none">'+
          '<option value="5"'+(groupCtxCount==='5'?' selected':'')+'>5条</option>'+
          '<option value="10"'+(groupCtxCount==='10'?' selected':'')+'>10条</option>'+
          '<option value="20"'+(groupCtxCount==='20'?' selected':'')+'>20条</option>'+
          '<option value="50"'+(groupCtxCount==='50'?' selected':'')+'>50条</option>'+
          '<option value="100"'+(groupCtxCount==='100'?' selected':'')+'>100条</option>'+
        '</select>'+
      '</div>'+
      '<div style="color:#666;font-size:11px;margin-top:8px">开启后会将群聊记录作为上下文提供给角色</div>'+
    '</div>'+
    '<button onclick="saveCharSettings()" style="width:100%;padding:12px;border:none;border-radius:10px;background:#9b59b6;color:#fff;font-size:14px;cursor:pointer">💾 保存设置</button>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // 填入prompt（避免模板字符串转义问题）
  document.getElementById('csPrompt').value=prompts[charId]||'';

  // 模型列表加载
  let presetSel=document.getElementById('csPresetSel');
  let modelList=document.getElementById('csModelList');
  function loadCSModels(){
    let pName=presetSel.value;
    let url=apiConfig.url, key=apiConfig.key;
    if(pName&&presets[pName]){url=presets[pName].url;key=presets[pName].key;}
    url=(url||'').replace(/\/$/,'');
    if(!url||!key){modelList.innerHTML='<div style="color:#e74c3c;font-size:12px;text-align:center;padding:12px">请先配置 API</div>';return;}
    modelList.innerHTML='<div style="color:#888;font-size:12px;text-align:center;padding:12px">加载中...</div>';
    fetch(url+'/models',{headers:{'Authorization':'Bearer '+key}}).then(r=>r.json()).then(data=>{
      let models=data.data||data;
      if(!models||!models.length){modelList.innerHTML='<div style="color:#888;font-size:12px;text-align:center;padding:12px">未获取到模型</div>';return;}
      let html='';
      models.forEach(m=>{
        let id=m.id||m;
        let active=id===currentModel?'background:#9b59b6;color:#fff':'background:#253554;color:#aaa';
        html+='<div class="cs-model-opt" data-model="'+id.replace(/"/g,'&quot;')+'" style="padding:8px 12px;margin:4px 0;border-radius:6px;cursor:pointer;font-size:12px;'+active+'">'+id+'</div>';
      });
      modelList.innerHTML=html;
      modelList.querySelectorAll('.cs-model-opt').forEach(el=>{
        el.onclick=()=>{
          modelList.querySelectorAll('.cs-model-opt').forEach(x=>x.style.cssText='padding:8px 12px;margin:4px 0;border-radius:6px;cursor:pointer;font-size:12px;background:#253554;color:#aaa');
          el.style.cssText='padding:8px 12px;margin:4px 0;border-radius:6px;cursor:pointer;font-size:12px;background:#9b59b6;color:#fff';
          currentModel=el.dataset.model;
          document.getElementById('csCurrentModel').textContent=currentModel;
        };
      });
    }).catch(e=>{modelList.innerHTML='<div style="color:#e74c3c;font-size:12px;text-align:center;padding:12px">加载失败</div>';});
  }
  presetSel.onchange=loadCSModels;
  modelList.onclick=function(e){if(e.target===modelList||e.target.querySelector('div'))loadCSModels();};
  loadCSModels();
}

async function saveCharSettings(){
  let charId=_csCharId;
  if(!charId)return;
  let modelEl=document.querySelector('.cs-model-opt[style*="#9b59b6"]');
  let model=modelEl?modelEl.dataset.model:'';
  let promptText=document.getElementById('csPrompt').value;
  let ctxCount=document.getElementById('csCtxRange').value;
  let groupCtx=document.getElementById('csGroupCtx').checked;
  let groupCtxCount=document.getElementById('csGroupCtxCount').value;
  let presetSel=document.getElementById('csPresetSel');
  let preset=presetSel?presetSel.value:'';

  // 存 localStorage
  if(model) localStorage.setItem('model_'+charId,model);
  if(preset) localStorage.setItem('preset_'+charId,preset);
  else localStorage.removeItem('preset_'+charId);
  localStorage.setItem('ctx_count_'+charId,ctxCount);
  localStorage.setItem('group_ctx_'+charId,groupCtx.toString());
  localStorage.setItem('group_ctx_count_'+charId,groupCtxCount);

  // 更新内存中的 prompt
  prompts[charId]=promptText;
  localStorage.setItem('home_prompts',JSON.stringify(prompts));

  // 写入PB（如果有PB地址）
  if(typeof PB_URL!=='undefined'&&PB_URL){
    try{
      let res=await fetch(PB_URL+'/api/collections/char_prompts/records?filter=character%3D%22'+encodeURIComponent(charId)+'%22');
      let data=await res.json();
      if(data&&data.items&&data.items.length){
        await fetch(PB_URL+'/api/collections/char_prompts/records/'+data.items[0].id,{
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({prompt:promptText})
        });
      }else{
        await fetch(PB_URL+'/api/collections/char_prompts/records',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({character:charId,prompt:promptText})
        });
      }
    }catch(e){}
  }

  document.getElementById('charSettingsModal').remove();
  showToast('设置已保存 ✅');
}
