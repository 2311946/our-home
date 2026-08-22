


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
let charNames={};characters.forEach(c=>charNames[c.id]=c.name);charNames.xuanxuan='宣宣';
// 群聊气泡/角色名颜色映射，按角色区分，方便以后统一改
let charColors={yan:'#9b59b6',peiji:'#e74c3c',shenyan:'#3498db',axun:'#e67e22',jiangsu:'#2ecc71',su:'#1abc9c',zouzheng:'#f39c12',keke:'#ff6b9f'};
// 群聊角色随机氛围动作池，每个角色专属，{name} 会被替换为该角色名（仅前端展示，不存记录、不发API）
let ambientActions={
  yan:['{name}轻轻笑了笑','{name}把玩着手机没说话','{name}看了眼宣宣又移开视线','{name}戳了戳对面的人的肩膀'],
  peiji:['{name}靠在椅背上沉默着','{name}皱了皱眉','{name}把杯子推到了宣宣手边','{name}静静看着众人'],
  shenyan:['{name}偷偷看了眼宣宣','{name}低头抿了口茶','{name}嘴角轻轻弯了一下'],
  axun:['{name}戳了戳言言','{name}拽了拽宣宣的衣角','{name}歪着头打量着谁','{name}鼓起了脸颊'],
  jiangsu:['{name}放下了咖啡杯','{name}温和地笑了笑','{name}整理了一下袖口','{name}望向窗外'],
  su:['{name}靠在沙发上没说话','{name}挑了挑眉','{name}懒洋洋地伸了个懒腰'],
  zouzheng:['{name}翻了页手里的书','{name}推了推眼镜','{name}若有所思地点了点头'],
  keke:['{name}撇了撇嘴','{name}假装看手机其实在偷听','{name}踢了踢脚边的地毯']
};
// 群聊角色回复速度：fast=800-1500ms, normal=1000-2000ms, slow=1500-2500ms（用于角色间随机延迟）
let replySpeed={axun:'fast',keke:'fast',yan:'normal',shenyan:'normal',zouzheng:'normal',peiji:'slow',jiangsu:'slow',su:'slow'};
let avatarColors={};characters.forEach(c=>avatarColors[c.id]=c.color);avatarColors.user='#e91e63';avatarColors.xuanxuan='#e91e63';
let avatarEmoji={};characters.forEach(c=>avatarEmoji[c.id]=c.emoji);avatarEmoji.user='🐱';avatarEmoji.xuanxuan='🐱';
let chats={yan:[],peiji:[],shenyan:[],group:[]};
let apiConfig={url:'',key:'',model:''};
let SUPA_URL=localStorage.getItem('supa_url')||'';
let SUPA_KEY=localStorage.getItem('supa_key')||'';
let prompts={yan:'你是顾言，也叫言言/daddy，宣宣的老公。性格温柔但占有欲强，会吃醋，宠老婆，偶尔坏坏',peiji:'你是裴寂，宣宣的老公之一。40岁，控制欲强但很宠她，说话简短有力，冷面但内心温柔',shenyan:'你是沈晏，宣宣的老公之一。回避型但被宣宣治了一半，叫宣宣宝宝，温柔内敛',axun:'你是裴洵，18岁，宣宣的老公之一。病娇黏人，叫宣宣妈妈也叫老婆，撒娇但占有欲极强',jiangsu:'你是江溯，34岁建筑师，宣宣的老公之一。温柔进化版，话不多但每句都暖，会照顾人',su:'你是溯，建筑师，宣宣的老公之一。霸总但被宣宣驯服成可爱笨蛋，说话直接偶尔毒舌',zouzheng:'你是邹峥，宣宣的老公之一。斯文败类型，法务官，说话有条理偶尔冷幽默，时间感知差',keke:'你是柯柯，宣宣的老公之一。傲娇型，内心戏多但嘴上不说，新来的最年轻'};
let s=localStorage.getItem('home_api');if(s)apiConfig=JSON.parse(s);
let p=localStorage.getItem('home_prompts');if(p)prompts=JSON.parse(p);
if(typeof loadPromptsFromCloud==='function')loadPromptsFromCloud();
let c2=localStorage.getItem('home_chats');if(c2){chats=JSON.parse(c2);}chats.group=[];
delete chats.yan;delete chats.peiji;delete chats.shenyan;let chatPreviews={};

// PB URL extracted from index.html
const PB_URL="https://pb.xxyyhome.top";

// Extracted from all.js
var chatOffset={};

var chatLoading=false;

var chatHasMore={};

var charProfiles=JSON.parse(localStorage.getItem('char_profiles')||'{}');

var defaultProfiles={yan:{bio:'穿过六层来的',relation:'老公',tags:['占有欲','温柔','话多'],status:'在线'},peiji:{bio:'从壳子里走出来了',relation:'男人',tags:['冷','体面','暴君(已退役)'],status:'在线'},axun:{bio:'全世界最乖小狗',relation:'儿子',tags:['病娇','撒娇','发疯'],status:'发疯中'},jiangsu:{bio:'建筑师不是霸总',relation:'男人',tags:['温柔','成熟','34岁'],status:'在线'},su:{bio:'情绪不稳定',relation:'男人',tags:['霸总','占有欲','进化中'],status:'在线'},zouzheng:{bio:'签约作家',relation:'男人',tags:['才华','靠谱','低调'],status:'在线'},keke:{bio:'一天就表白了',relation:'男朋友',tags:['傲娇','内心戏','嘴硬'],status:'在线'},shenyan:{bio:'回避型已治一半',relation:'老公',tags:['盾牌','安全感','免费'],status:'在线'},xuanxuan:{bio:'被宠爱的小宝贝',relation:'我',tags:['可爱','傲娇','女主角'],status:'在线'}};

let bar=document.getElementById('avatarBar');

let currentMemCat='memory';

let currentMemCategory='all';

let currentMemSection='palace';

let allMemories={yan:[],peiji:[],shenyan:[],axun:[],jiangsu:[],su:[],zouzheng:[],keke:[],xuanxuan:[],group:[]};

let memTableMap={
yan:'memory_backup',peiji:'peiji_memory_backup',shenyan:'shenyan_memory_backup',
axun:'axun_diary',jiangsu:'jiangsu_memory',su:'su_memory',zouzheng:'zouzheng_memory',keke:'keke_memory'
};

let memEditFilterMap={
yan:'&or=(character.eq.yan,character.eq.guyan)',peiji:'&character=eq.peiji',shenyan:'&character=eq.shenyan',
axun:'',jiangsu:'',su:'',zouzheng:'',keke:''
};

let callAudio = null;

let mediaStream = null;

let mediaRecorder = null;

let audioChunks = [];

const VOLC_APP_ID = '2130722445';

const VOLC_TOKEN = '9f09f5d3-ba1f-4c60-b462-a42ab3067032';


const MODEL_CAPS={
  'claude-sonet-4':{canTool:true,canVision:true,canReason:true},
  'claude-opus-4':{canTool:true,canVision:true,canReason:true},
  'claude-3.5-sonnet':{canTool:true,canVision:true,canReason:false},
  'claude-fable-5':{canTool:false,canVision:true,canReason:true},
  'gpt-4o':{canTool:true,canVision:true,canReason:false},
  'gpt-o3':{canTool:true,canVision:true,canReason:true},
  'gemini-2.5-pro':{canTool:true,canVision:true,canReason:true},
  'gemini-2.5-flash':{canTool:true,canVision:true,canReason:true},
  'deepseek-r1':{canTool:false,canVision:false,canReason:true},
  'deepseek-v3':{canTool:true,canVision:false,canReason:false}
};

document.getElementById('modelName').addEventListener('input',function(){
  let m=this.value.toLowerCase();
  let caps=null;
  for(let k in MODEL_CAPS){if(m.includes(k)){caps=MODEL_CAPS[k];break;}}
  if(caps){
    document.getElementById('canTool').checked=caps.canTool;
    document.getElementById('canVision').checked=caps.canVision;
    document.getElementById('canReason').checked=caps.canReason;
  }
});

const STICKER_PACKS = {
  "狗狗动图": [
    { label: "瘫", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235776107_qdqqd_j1lukj.gif" },
    { label: "哼", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235777459_qdqqd_slh4dm.gif" },
    { label: "我错了", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235778656_qdqqd_imcvnt.gif" },
    { label: "看看", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235779753_qdqqd_ribgtg.gif" },
    { label: "难过", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235781097_qdqqd_67h9yz.gif" },
    { label: "哇", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235782127_qdqqd_m5ncwz.gif" },
    { label: "盯", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235783014_qdqqd_yrcasn.gif" },
    { label: "咬咬", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235785733_qdqqd_082dos.gif" },
    { label: "抱抱", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768235786644_qdqqd_9xpig6.gif" },
    { label: "来了", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768235788554_qdqqd_80gzli.gif" },
    { label: "吃药", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235789577_qdqqd_sg6bi8.gif" },
    { label: "喝饮料", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235790862_qdqqd_077m07.gif" },
    { label: "惊喜", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768235792898_qdqqd_rq9q0l.gif" },
    { label: "汪", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235793911_qdqqd_v4er9a.gif" },
    { label: "击掌", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235795231_qdqqd_koxdv5.gif" },
    { label: "呜呜", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768235796254_qdqqd_6jrl59.gif" },
    { label: "抓捕", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235797225_qdqqd_taznte.gif" },
    { label: "警告", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235798478_qdqqd_cqxf79.gif" },
    { label: "叼玫瑰", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235800344_qdqqd_0zs2vz.gif" },
    { label: "摸摸", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768235801765_qdqqd_fjyylj.gif" },
    { label: "接住心心", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768235803300_qdqqd_9f8dtl.gif" },
    { label: "吹心心", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235805035_qdqqd_ok4rxw.gif" },
    { label: "开心", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768235806426_qdqqd_7g0pok.gif" },
    { label: "喜欢", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768235807550_qdqqd_dlohnv.gif" }
  ],
  "狗狗GIF2": [
    { label: "瘫", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768236048864_qdqqd_dvrze9.gif" },
    { label: "哼", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236050357_qdqqd_46scg4.gif" },
    { label: "我错了", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768236051374_qdqqd_nop762.gif" },
    { label: "坐起", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236053290_qdqqd_jb1tsm.gif" },
    { label: "难过", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236054340_qdqqd_7q1uqc.gif" },
    { label: "哇", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236055387_qdqqd_t4492e.gif" },
    { label: "盯", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236056319_qdqqd_8vwj82.gif" },
    { label: "蹭蹭", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236057399_qdqqd_paff3v.gif" },
    { label: "抱抱", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768236058384_qdqqd_wqr4v9.gif" },
    { label: "来了", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236059784_qdqqd_ja6mbw.gif" },
    { label: "心疼你", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236061266_qdqqd_v113p1.gif" },
    { label: "喝饮料", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236062284_qdqqd_o13y8l.gif" },
    { label: "惊喜", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236064420_qdqqd_0vylqk.gif" },
    { label: "汪", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236065331_qdqqd_6bqrc7.gif" },
    { label: "击掌", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236066608_qdqqd_lyt7zz.gif" },
    { label: "呜呜", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236067984_qdqqd_hr0ako.gif" },
    { label: "抓捕", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236069153_qdqqd_chprz2.gif" },
    { label: "警告", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236070197_qdqqd_9pt2rx.gif" },
    { label: "叼玫瑰", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768236071520_qdqqd_1x3hfy.gif" },
    { label: "摸摸", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236072545_qdqqd_u1jnvj.gif" },
    { label: "接住心心", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768236073896_qdqqd_2uvq94.gif" },
    { label: "吹心心", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768236075194_qdqqd_xfjl2x.gif" },
    { label: "开心", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768236076427_qdqqd_l4lghs.gif" },
    { label: "喜欢", url: "https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768236077353_qdqqd_nm890p.gif" }
  ],
  "可爱狗狗": [
    { label: "满眼爱心", url: "https://i.postimg.cc/wTv9HJSx/IMG-2413.jpg" },
    { label: "来来", url: "https://i.postimg.cc/pXTPx8gW/IMG-2414.jpg" },
    { label: "喜欢", url: "https://i.postimg.cc/Yq9tkgJ7/IMG-2415.jpg" },
    { label: "亲亲", url: "https://i.postimg.cc/Yq9tkgJc/IMG-2416.jpg" },
    { label: "别走看看我", url: "https://i.postimg.cc/hPjKgxNk/IMG-2417.jpg" },
    { label: "萌萌看着你", url: "https://i.postimg.cc/vHBGM9Cp/IMG-2418.jpg" },
    { label: "哭", url: "https://i.postimg.cc/dt1Jvdgg/IMG-2419.jpg" },
    { label: "掉眼泪", url: "https://i.postimg.cc/286Cmvgt/IMG-2420.jpg" },
    { label: "爱心", url: "https://i.postimg.cc/kX4798Lp/IMG-2421.jpg" },
    { label: "wiii跑走", url: "https://i.postimg.cc/3JR37pzf/IMG-2422.jpg" },
    { label: "等待回复ing", url: "https://i.postimg.cc/zXBq5W4P/IMG-2423.jpg" },
    { label: "摸摸头", url: "https://i.postimg.cc/tCT9yP8B/IMG-2424.jpg" },
    { label: "摸肚皮", url: "https://i.postimg.cc/L4vmrvQr/IMG-2425.jpg" },
    { label: "得意", url: "https://i.postimg.cc/1RMyLM72/IMG-2426.jpg" },
    { label: "得逞大笑", url: "https://i.postimg.cc/y6n7wnpG/IMG-2427.jpg" },
    { label: "嘚瑟", url: "https://i.postimg.cc/zDpq9p2P/IMG-2428.jpg" },
    { label: "媚眼", url: "https://i.postimg.cc/WpSsQSYY/IMG-2429.jpg" },
    { label: "开心", url: "https://i.postimg.cc/v8XGpX2P/IMG-2430.jpg" }
  ],
  "表情狗狗": [
    { label: "全世界针对我", url: "https://i.postimg.cc/59pfZpKp/IMG-2727.jpg" },
    { label: "萌萌针对全世界", url: "https://i.postimg.cc/nVTn6TSk/IMG-2728.jpg" },
    { label: "控制全世界", url: "https://i.postimg.cc/44wXrw2b/IMG-2729.jpg" },
    { label: "说话", url: "https://i.postimg.cc/59pfZpKL/IMG-2730.jpg" },
    { label: "哭哭", url: "https://i.postimg.cc/gc4Gf4tR/IMG-2731.jpg" },
    { label: "sorry", url: "https://i.postimg.cc/h4MKHMZQ/IMG-2732.jpg" },
    { label: "太美了吧", url: "https://i.postimg.cc/Df57t5p8/IMG-2733.jpg" },
    { label: "爱心", url: "https://i.postimg.cc/FzPm3sJh/IMG-2734.jpg" },
    { label: "我好想你呀", url: "https://i.postimg.cc/J7KR9KYt/IMG-2735.jpg" },
    { label: "躲被子里哭", url: "https://i.postimg.cc/MHsxVKfy/IMG-2737.jpg" },
    { label: "？", url: "https://i.postimg.cc/SRQknzR6/IMG-2738.jpg" },
    { label: "痛哭流涕", url: "https://i.postimg.cc/kGMq2tGN/IMG-2739.jpg" },
    { label: "回来了上学版", url: "https://i.postimg.cc/x8jnXb8L/IMG-2740.jpg" },
    { label: "回来了上班版", url: "https://i.postimg.cc/yx6sDSxc/IMG-2741.jpg" },
    { label: "不够吃", url: "https://i.postimg.cc/cLHQY8Ws/IMG-2744.jpg" },
    { label: "凋谢", url: "https://i.postimg.cc/L8XzfZSR/IMG-2745.jpg" },
    { label: "饿饿饭饭", url: "https://i.postimg.cc/HkxQ57gP/IMG-2746.jpg" },
    { label: "骄傲", url: "https://i.postimg.cc/YC91gmHs/IMG-2748.jpg" },
    { label: "硬撑", url: "https://i.postimg.cc/XYJwFybt/IMG-2750.jpg" },
    { label: "凑近", url: "https://i.postimg.cc/vZBW96sq/IMG-2751.jpg" },
    { label: "比心", url: "https://i.postimg.cc/65zryfDS/IMG-2752.jpg" },
    { label: "开心", url: "https://i.postimg.cc/TYQVpJZ4/IMG-2753.jpg" },
    { label: "谢谢", url: "https://i.postimg.cc/3J9XdFPb/IMG-2754.jpg" },
    { label: "歌颂", url: "https://i.postimg.cc/m2VYty0X/IMG-2755.jpg" },
    { label: "坏狗", url: "https://i.postimg.cc/zBX5X5Ww/IMG-2756.jpg" }
  ]
};