import sqlite3, json, requests, time
from datetime import datetime

DB='/Users/wangxiaoxuan/Desktop/wangxiaoxuan/rikkahub_backup_20260811_095259/rikka_hub.db'
PB='http://43.167.236.193:8090'

CONV_MAP={
  '5baa358d-3c7b-4125-8':'yan',
  'a91d7c72-7f91-457e-8':'yan',
  'd024359f-0c4b-4e1d-9':'yan',
  '02303220-2c27-48a9-8':'peiji',
  'c560636c-d6c9-4a6c-8':'axun',
  '902ec004-d91f-4007-9':'jiangsu',
  'da688b4f-abbe-40c6-8':'su',
  'f7128004-52c7-4daf-b':'zouzheng',
}

conn=sqlite3.connect(DB)
convs=conn.execute('SELECT id FROM ConversationEntity').fetchall()
full_map={}
for (cid,) in convs:
    for prefix,char in CONV_MAP.items():
        if cid.startswith(prefix):
            full_map[cid]=char;break

print(f'匹配到 {len(full_map)} 个对话')

def get_latest(char):
    try:
        r=requests.get(f'{PB}/api/collections/chat_messages/records?filter=(character="{char}")&sort=-msg_time&perPage=1')
        items=r.json().get('items',[])
        if items: return items[0]['msg_time']
    except: pass
    return None

total=0
for conv_id,character in full_map.items():
    title=conn.execute('SELECT title FROM ConversationEntity WHERE id=?',(conv_id,)).fetchone()[0]
    print(f'\n💬 {title} → {character}')
    latest='2026-08-09T00:00:00'
    if latest: print(f'   已有数据到: {latest}')

    rows=conn.execute('SELECT node_index,messages FROM message_node WHERE conversation_id=? ORDER BY node_index',(conv_id,)).fetchall()
    msgs=[]
    for _,messages_json in rows:
        if not messages_json: continue
        try: messages=json.loads(messages_json)
        except: continue
        for msg in messages:
            if not isinstance(msg,dict): continue
            role_raw=msg.get('role','')
            parts=msg.get('parts',[])
            text=''
            for part in parts:
                if isinstance(part,dict) and part.get('type')=='text':
                    text+=part.get('text','')
            if not text.strip(): continue
            if role_raw=='user': role='user'
            elif role_raw in ('assistant','model'): role='ai'
            else: continue
            created=msg.get('createdAt','')
            if created and 'T' in created:
                if '+' not in created and 'Z' not in created: created+='+08:00'
            else: created=None
            msgs.append({'character':character,'role':role,'content':text,'msg_time':created})

    if latest:
        new_msgs=[m for m in msgs if m['msg_time'] and m['msg_time']>latest]
    else:
        new_msgs=msgs
    print(f'   总{len(msgs)}条, 新{len(new_msgs)}条')

    inserted=0
    failed=0
    for i,m in enumerate(new_msgs):
        for retry in range(3):
            try:
                r=requests.post(f'{PB}/api/collections/chat_messages/records',json=m,timeout=10)
                if r.status_code==200:
                    inserted+=1
                    break
                else:
                    failed+=1
                    break
            except:
                if retry<2:
                    print(f'   ⚠️ 连接断开，等15秒重试...')
                    time.sleep(15)
                else:
                    failed+=1
                    print(f'   ❌ 第{i+1}条写入失败')
        if (i+1)%200==0:
            print(f'   进度: {i+1}/{len(new_msgs)} ({inserted}✅ {failed}❌)')
            time.sleep(15)
        time.sleep(0.1)
    print(f'   ✅ 写入{inserted}条, 失败{failed}条')
    total+=inserted

conn.close()
print(f'\n🎉 全部完成！共写入 {total} 条')
