


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
  "这狗28": [
    { label: "爱", url: "https://iilli.io/CiN2zN4.png" },
    { label: "可怜", url: "https://iilli.io/CiN2oHG.png" },
    { label: "吓哭了", url: "https://iilli.io/CiN2CSs.png" },
    { label: "走开", url: "https://iilli.io/CiN2qKX.png" },
    { label: "震惊", url: "https://iilli.io/CiN2lHb.png" },
    { label: "气呼呼", url: "https://iilli.io/CiN2AVS.png" },
    { label: "激动", url: "https://iilli.io/CiN2aUu.png" },
    { label: "爽", url: "https://iilli.io/CiN2VWB.png" },
    { label: "倒下了", url: "https://iilli.io/CiN2wUg.png" },
    { label: "不好意思", url: "https://iilli.io/CiN2vbR.png" },
    { label: "我不听", url: "https://iilli.io/CiN2gsl.png" },
    { label: "干得漂亮", url: "https://iilli.io/CiNcKsS.png" },
    { label: "花花", url: "https://iilli.io/CiNcB19.png" },
    { label: "比心", url: "https://iilli.io/CiNY4wl.png" },
    { label: "狂怒", url: "https://iilli.io/CiNY6t2.png" },
    { label: "品鉴", url: "https://iilli.io/CiNYin5.png" },
    { label: "无语", url: "https://iilli.io/CiNYLP9.png" },
    { label: "啊", url: "https://iilli.io/CiNYsM7.png" },
    { label: "哦", url: "https://iilli.io/CiNYZFe.png" },
    { label: "嗯", url: "https://iilli.io/CiNYtcu.png" },
    { label: "吸狗", url: "https://iilli.io/CiNczej.png" },
    { label: "幸福", url: "https://iilli.io/CiNclmx.png" },
    { label: "烦躁", url: "https://iilli.io/CiNcodu.png" },
    { label: "打电话", url: "https://iilli.io/CiNcx5b.png" }
  ],
  "这狗22": [
    { label: "哈哈哈", url: "https://iilli.io/CiDlMq7.png" },
    { label: "期待", url: "https://iilli.io/CiDlWge.png" },
    { label: "嗷嗷嗷", url: "https://iilli.io/CiDlEsS.png" },
    { label: "嗷嗷嗷2", url: "https://iilli.io/CiDlV19.png" },
    { label: "开心", url: "https://iilli.io/CiDlSqP.png" },
    { label: "拉屎", url: "https://iilli.io/CiDlezQ.png" },
    { label: "打耳洞", url: "https://iilli.io/CiDlkXV.png" },
    { label: "碰瓷", url: "https://iilli.io/CiDlvLB.png" },
    { label: "抱歉", url: "https://iilli.io/CiDlU11.png" },
    { label: "摆烂", url: "https://iilli.io/CiDl4dg.png" },
    { label: "好累", url: "https://iilli.io/CiDlgrF.png" },
    { label: "转圈", url: "https://iilli.io/CiDl67a.png" },
    { label: "仰望", url: "https://iilli.io/CiDllimv.png" },
    { label: "我是狗", url: "https://iilli.io/CiDlQXp.png" },
    { label: "一起玩", url: "https://iilli.io/CiDlDBl.png" },
    { label: "安逸", url: "https://iilli.io/CiDlZLN.png" },
    { label: "喜欢", url: "https://iilli.io/CiDlb1t.png" },
    { label: "心动", url: "https://iilli.io/CiDly2n.png" },
    { label: "呜呜呜", url: "https://iilli.io/CiDTFQ2.png" },
    { label: "倒地", url: "https://iilli.io/CiDT2I4.png" },
    { label: "偷心", url: "https://iilli.io/CiDTfBS.png" },
    { label: "胜利", url: "https://iilli.io/CiDT3hl.png" },
    { label: "干杯", url: "https://iilli.io/CiDTB49.png" },
    { label: "主理人", url: "https://iilli.io/CiDTn2e.png" }
  ],
  "呆猫GIF": [
    { label: "怨念", url: "https://iilli.io/Cin6DzJ.gif" },
    { label: "神气", url: "https://iilli.io/Cin6yfp.gif" },
    { label: "小心翼翼", url: "https://iilli.io/Cin6Zba.gif" },
    { label: "生气", url: "https://iilli.io/Cin6bWv.gif" },
    { label: "开心", url: "https://iilli.io/CinP90N.gif" },
    { label: "喜欢", url: "https://iilli.io/CinPHgl.gif" },
    { label: "歪头", url: "https://iilli.io/CinPFbs.gif" },
    { label: "ok", url: "https://iilli.io/CinPqXf.gif" },
    { label: "嗯嗯", url: "https://iilli.io/CinPBs4.gif" },
    { label: "防备", url: "https://iilli.io/CinPfzG.gif" },
    { label: "委屈", url: "https://iilli.io/CinPo12.gif" },
    { label: "截手手", url: "https://iilli.io/CinPnql.gif" },
    { label: "鄙视", url: "https://iilli.io/CinPld7.gif" },
    { label: "我很好", url: "https://iilli.io/CinPT79.gif" },
    { label: "呆滞", url: "https://iilli.io/Cin6RcX.gif" },
    { label: "惊", url: "https://iilli.io/CinPuee.gif" },
    { label: "木嘿嘿嘿", url: "https://iilli.io/CLi7EBV.png" },
    { label: "坏", url: "https://iilli.io/CLi70LQ.png" },
    { label: "狠", url: "https://iilli.io/CLi7clj.png" },
    { label: "指", url: "https://iilli.io/CLi7lhx.png" },
    { label: "淡定", url: "https://iilli.io/CLi7W21.png" },
    { label: "石化", url: "https://iilli.io/CLi7hkg.png" },
    { label: "棒", url: "https://iilli.io/CLi7jpa.png" },
    { label: "被看扁了", url: "https://iilli.io/CLi7NTJ.png" },
    { label: "问号", url: "https://iilli.io/CLi7Ohv.png" },
    { label: "萌萌看着", url: "https://iilli.io/CLi78EN.png" },
    { label: "我看中", url: "https://iilli.io/CLi7eQR.png" },
    { label: "笨", url: "https://iilli.io/CLi7vBp.png" },
    { label: "饿", url: "https://iilli.io/CLi7S4l.png" },
    { label: "受不了", url: "https://iilli.io/CLi7g2t.png" },
    { label: "哇", url: "https://iilli.io/CLi76ps.png" },
    { label: "拳头硬了", url: "https://iilli.io/CLi7rYX.png" },
    { label: "警觉", url: "https://iilli.io/CLi74vn.png" },
    { label: "无了", url: "https://iilli.io/CLi7iTG.png" },
    { label: "爱你", url: "https://iilli.io/CLi7sjf.png" },
    { label: "别搞", url: "https://iilli.io/CLi7LQ4.png" },
    { label: "喜欢", url: "https://iilli.io/CLi7tG2.png" },
    { label: "晕倒", url: "https://iilli.io/CLiEiSp.png" },
    { label: "拍拍", url: "https://iilli.io/CLiEPlR.png" },
    { label: "死寂", url: "https://iilli.io/CLiE6Kv.png" }
  ],
  "比格多栋": [
    { label: "喜", url: "https://iilli.io/Cif0K0u.png" },
    { label: "捂住头", url: "https://iilli.io/Cif14nl.png" },
    { label: "一杯泪水", url: "https://iilli.io/CifEuSa.png" },
    { label: "僧", url: "https://iilli.io/CifGfgn.png" },
    { label: "极恶", url: "https://iilli.io/CifMJkb.png" },
    { label: "困", url: "https://iilli.io/CifMLcF.png" },
    { label: "哭", url: "https://iilli.io/CifMLcF.png" },
    { label: "惊了", url: "https://iilli.io/CifX3TG.png" },
    { label: "心", url: "https://iilli.io/Cifh5Rn.png" },
    { label: "看哭", url: "https://iilli.io/CifjK12.png" },
    { label: "白眼", url: "https://iilli.io/Cifji2l.png" },
    { label: "指着头", url: "https://iilli.io/CifwBGR.png" },
    { label: "不", url: "https://iilli.io/CifO2LJ.png" },
    { label: "舔了手机", url: "https://iilli.io/CifkdKv.png" },
    { label: "求救", url: "https://iilli.io/CifkdKv.png" },
    { label: "爆冲", url: "https://iilli.io/Cif8HaR.png" }
  ]
};