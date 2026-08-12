
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
