


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
  "狗狗GIF": [
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
  "想你撒娇": [
    { label: "等你", url: "https://img.heliar.top/file/1771899930602_ScreenShot_2026-02-13_140615_724.png" },
    { label: "充电中", url: "https://img.heliar.top/file/1771899928840_宝宝，你要放轻松_5_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "晚安", url: "https://img.heliar.top/file/1771899929084_宝宝，你要放轻松_6_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "晚安吻", url: "https://img.heliar.top/file/1771899927830_宝宝，你要放轻松_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "我去洗澡啦", url: "https://img.heliar.top/file/1771899929114_宝宝，你要放轻松_8_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "抱抱", url: "https://img.heliar.top/file/1771899929767_报告！我在…想你！_1_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "在偷偷想你", url: "https://img.heliar.top/file/1771899934831_报告！我在…想你！_2_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "宝宝我来啦", url: "https://img.heliar.top/file/1771899934238_报告！我在…想你！_3_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "我好想你呀", url: "https://img.heliar.top/file/1771899941389_报告！我在…想你！_4_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "花花送你", url: "https://img.heliar.top/file/1771899935931_报告！我在…想你！_5_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "扭捏", url: "https://img.heliar.top/file/1771899933492_报告！我在…想你！_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "心都给你", url: "https://img.heliar.top/file/1771899939758_报告！我在…想你！_9_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "送给你", url: "https://img.heliar.top/file/1771900208603_我会超经意表达喜欢你！_1_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "每天都想你", url: "https://img.heliar.top/file/1771900252008_我会超经意表达喜欢你！_2_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "亲亲", url: "https://img.heliar.top/file/1771900204443_我会超经意表达喜欢你！_3_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "喜欢", url: "https://img.heliar.top/file/1771900078864_我会超经意表达喜欢你！_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "小花花来咯", url: "https://img.heliar.top/file/1771900069905_我会超经意表达喜欢你！_9_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "焦急等回复", url: "https://img.heliar.top/file/1771900070811_我一直在等！！_3_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "等到花都谢啦", url: "https://img.heliar.top/file/1771900070640_我一直在等！！_4_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "满怀期待", url: "https://img.heliar.top/file/1771900080516_我一直在等！！_12_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "贴贴", url: "https://img.heliar.top/file/1771899963903_姐宝女专用表情包！_6_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "哎呦脸红", url: "https://img.heliar.top/file/1771900250874_你好…请…请亲这里…_8_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "你值得最美的花", url: "https://img.heliar.top/file/1771900012075_愿你热烈绽放_不止今天_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "我想跟你好", url: "https://img.heliar.top/file/1771900074417_友宝女专用表情！！_1_蘸只JiAH酱_来自小红书网页版.jpg" }
  ],
  "日常小狗": [
    { label: "脸好烫", url: "https://img.heliar.top/file/1771899945612_本来以为是心动呢……_5_这狗_来自小红书网页版.jpg" },
    { label: "萌", url: "https://img.heliar.top/file/1771899943613_玻璃心，孩子能做童模吗_1_这狗_来自小红书网页版.jpg" },
    { label: "不好意思", url: "https://img.heliar.top/file/1771900023751_玻璃心，孩子能做童模吗_2_这狗_来自小红书网页版.jpg" },
    { label: "一起睡吗", url: "https://img.heliar.top/file/1771899946695_参见被窝小皇帝_3_这狗_来自小红书网页版.jpg" },
    { label: "睡了", url: "https://img.heliar.top/file/1771899946163_参见被窝小皇帝_5_这狗_来自小红书网页版.jpg" },
    { label: "发出被窝共享邀请", url: "https://img.heliar.top/file/1771899948293_分享欲旺盛的一集_1_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "不理解", url: "https://img.heliar.top/file/1771899951732_狗，就这样学习_4_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "捧在手心", url: "https://img.heliar.top/file/1771899952932_狗善被人吸_1_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "饿饿", url: "https://img.heliar.top/file/1771900024736_狗善被人吸_3_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "摸肚皮", url: "https://img.heliar.top/file/1771900028028_狗善被人吸_5_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "好不好嘛", url: "https://img.heliar.top/file/1771900021397_狗善被人吸_9_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "骄傲", url: "https://img.heliar.top/file/1771900021565_狗善被人吸_14_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "坏狗", url: "https://img.heliar.top/file/1771900021072_狗太坏了！！_1_这狗_来自小红书网页版.jpg" },
    { label: "委屈哭哭", url: "https://img.heliar.top/file/1771900024743_狗太坏了！！_2_这狗_来自小红书网页版.jpg" },
    { label: "趴着玩手机", url: "https://img.heliar.top/file/1771899962354_今天不需要人陪，我自己玩！_2_这狗_来自小红书网页版.jpg" },
    { label: "躺着玩手机", url: "https://img.heliar.top/file/1771899961801_今天不需要人陪，我自己玩！_3_这狗_来自小红书网页版.jpg" },
    { label: "停停停", url: "https://img.heliar.top/file/1771899960879_苦公共场所不文明二手烟久矣_3_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "看我看我", url: "https://img.heliar.top/file/1771899966357_老大！看我看我！！！_1_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "心碎小狗求收留", url: "https://img.heliar.top/file/1771899958884_老大！看我看我！！！_4_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "闪闪发光", url: "https://img.heliar.top/file/1771900031397_老大！看我看我！！！_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "麻了", url: "https://img.heliar.top/file/1771899961261_连着翻就是体测日记_3_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "好累", url: "https://img.heliar.top/file/1771900034925_连着翻就是体测日记_8_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "已归西", url: "https://img.heliar.top/file/1771900085690_麻麻酱_人类世界好漂亮_11_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "好困", url: "https://img.heliar.top/file/1771900015408_做最困的都市隶人_1_蘸只JiAH酱_来自小红书网页版.jpg" }
  ],
  "表情狗": [
    { label: "狗大叫", url: "https://img.heliar.top/file/1771900130402_你醒了，你已经变成狗了_2_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗揣手手", url: "https://img.heliar.top/file/1771900137613_你醒了，你已经变成狗了_3_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗带", url: "https://img.heliar.top/file/1771900214093_你醒了，你已经变成狗了_5_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗怒", url: "https://img.heliar.top/file/1771900133933_你醒了，你已经变成狗了_6_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗后退", url: "https://img.heliar.top/file/1771900131849_你醒了，你已经变成狗了_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗趴着", url: "https://img.heliar.top/file/1771900139416_你醒了，你已经变成狗了_8_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗狗呆滞", url: "https://img.heliar.top/file/1771900141457_你醒了，你已经变成狗了_9_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗哭", url: "https://img.heliar.top/file/1771900256306_你醒了，你已经变成狗了_10_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗嘻嘻", url: "https://img.heliar.top/file/1771900142733_你醒了，你已经变成狗了_11_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗不嘻嘻", url: "https://img.heliar.top/file/1771900139919_你醒了，你已经变成狗了_12_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗坐", url: "https://img.heliar.top/file/1771900137550_你醒了，你已经变成狗了_13_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗走开", url: "https://img.heliar.top/file/1771900146752_你醒了，你已经变成狗了_14_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗疑惑", url: "https://img.heliar.top/file/1771900150096_你醒了，你已经变成狗了_15_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "狗思考", url: "https://img.heliar.top/file/1771900148138_你醒了，你已经变成狗了_16_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "哈哈哈", url: "https://img.heliar.top/file/1771900206270_我！是快乐的狗！！_1_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "太好啦", url: "https://img.heliar.top/file/1771900253013_我！是快乐的狗！！_2_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "兴奋", url: "https://img.heliar.top/file/1771900204513_我！是快乐的狗！！_4_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "戳脸", url: "https://img.heliar.top/file/1771900208585_我！是快乐的狗！！_5_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "小狗歪头看你", url: "https://img.heliar.top/file/1771900064252_我！是快乐的狗！！_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "幸福看手机", url: "https://img.heliar.top/file/1771900063402_我！是快乐的狗！！_10_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "期待的眼神", url: "https://img.heliar.top/file/1771900150445_请看！这里有一只宝宝！_1_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "宝想要", url: "https://img.heliar.top/file/1771900247215_请看！这里有一只宝宝！_6_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "宝得到", url: "https://img.heliar.top/file/1771900148710_请看！这里有一只宝宝！_7_蘸只JiAH酱_来自小红书网页版.jpg" },
    { label: "得意的小狗", url: "https://img.heliar.top/file/1771900182897_人！你和我学_1_这狗_来自小红书网页版.jpg" }
  ]
};