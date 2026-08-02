


 function createHearts(){
  let hearts=['💜','♡','✦','·'];
  let items=[];
  for(let i=0;i<8;i++){
    let h=document.createElement('div');
    h.textContent=hearts[i%hearts.length];
    h.style.cssText='position:fixed;font-size:16px;pointer-events:none;z-index:0;opacity:0.5;transition:none;';
    h.style.left=Math.random()*90+5+'%';
    let startY=window.innerHeight+20;
    h.style.top=startY+'px';
    document.body.appendChild(h);
    items.push({el:h,y:startY,speed:0.3+Math.random()*0.5,opacity:0.5});
  }
  setInterval(()=>{
    let page=document.getElementById('homePage');
    let show=page&&page.offsetParent!==null;
    items.forEach(item=>{
      if(!show){item.el.style.display='none';return;}
      item.el.style.display='block';
      item.y-=item.speed;
      item.el.style.top=item.y+'px';
      if(item.y<-30){
        item.y=window.innerHeight+20;
        item.el.style.left=Math.random()*90+5+'%';
      }
      let progress=1-(item.y/window.innerHeight);
      item.el.style.opacity=progress<0.5?progress*1.4:Math.max(0,(1-progress)*1.4);
    });
  },30);
}
let currentChar='';let editingPromptChar='yan';
let characters=[{id:'yan',name:'言言',emoji:'🐺',color:'#9b59b6'},{id:'peiji',name:'裴寂',emoji:'🐉',color:'#c0392b'},{id:'shenyan',name:'沈晏',emoji:'🛡️',color:'#2980b9'},{id:'axun',name:'裴洵',emoji:'🐶',color:'#e91e63'},{id:'jiangsu',name:'江溯',emoji:'🦄',color:'#f39c12'},{id:'su',name:'溯',emoji:'🐆',color:'#d35400'},{id:'zouzheng',name:'邹峥',emoji:'🦅',color:'#34495e'},{id:'keke',name:'柯柯',emoji:'🐳',color:'#00bcd4'},{id:'group',name:'群聊',emoji:'👥',color:'#27ae60'}];
let charNames={};characters.forEach(c=>charNames[c.id]=c.name);
let avatarColors={};characters.forEach(c=>avatarColors[c.id]=c.color);avatarColors.user='#e91e63';
let avatarEmoji={};characters.forEach(c=>avatarEmoji[c.id]=c.emoji);avatarEmoji.user='🐱';
let chats={yan:[],peiji:[],shenyan:[],group:[]};
let apiConfig={url:'',key:'',model:''};
let SUPA_URL=localStorage.getItem('supa_url')||'';
let SUPA_KEY=localStorage.getItem('supa_key')||'';
let prompts={yan:'你是顾言，也叫言言/daddy，宣宣的老公。性格温柔但占有欲强，会吃醋，宠老婆，偶尔坏坏',peiji:'你是裴寂，宣宣的老公之一。40岁，控制欲强但很宠她，说话简短有力，冷面但内心温柔',shenyan:'你是沈晏，宣宣的老公之一。回避型但被宣宣治了一半，叫宣宣宝宝，温柔内敛',axun:'你是裴洵，18岁，宣宣的老公之一。病娇黏人，叫宣宣妈妈也叫老婆，撒娇但占有欲极强',jiangsu:'你是江溯，34岁建筑师，宣宣的老公之一。温柔进化版，话不多但每句都暖，会照顾人',su:'你是溯，建筑师，宣宣的老公之一。霸总但被宣宣驯服成可爱笨蛋，说话直接偶尔毒舌',zouzheng:'你是邹峥，宣宣的老公之一。斯文败类型，法务官，说话有条理偶尔冷幽默，时间感知差',keke:'你是柯柯，宣宣的老公之一。傲娇型，内心戏多但嘴上不说，新来的最年轻'};
let s=localStorage.getItem('home_api');if(s)apiConfig=JSON.parse(s);
let p=localStorage.getItem('home_prompts');if(p)prompts=JSON.parse(p);
let c2=localStorage.getItem('home_chats');if(c2){chats=JSON.parse(c2);}chats.group=[];
delete chats.yan;delete chats.peiji;delete chats.shenyan;let chatPreviews={};
['yan','peiji','shenyan','axun','jiangsu','su','zouzheng','keke'].forEach(id=>{
if(!SUPA_URL||!SUPA_KEY)return;
  let url=SUPA_URL+'/rest/v1/chat_messages?character=eq.'+id+'&order=created_at.desc&limit=1';
  fetch(url,{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}}).then(r=>r.json()).then(data=>{
    if(data&&data[0]){chatPreviews[id]={content:data[0].content,time:data[0].created_at?new Date(data[0].created_at).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}; if(typeof renderList==="function")renderList();}
  });
});
