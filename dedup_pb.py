"""PB聊天消息去重脚本 - 保留每组重复的第一条，删除多余的"""
import requests

PB = "http://43.167.236.193:8090"
page = 1
dupes = []
seen = set()

print("扫描重复消息...")
while True:
    r = requests.get(f"{PB}/api/collections/chat_messages/records?perPage=500&page={page}&sort=msg_time")
    data = r.json()
    items = data.get("items", [])
    if not items:
        break
    for item in items:
        key = (item["character"], item["role"], item["content"], item["msg_time"])
        if key in seen:
            dupes.append(item["id"])
        else:
            seen.add(key)
    print(f"  已扫描 {page * 500} 条，发现 {len(dupes)} 条重复")
    page += 1
    if page > data.get("totalPages", 1):
        break

print(f"\n共发现 {len(dupes)} 条重复，开始删除...")
for i, rid in enumerate(dupes):
    requests.delete(f"{PB}/api/collections/chat_messages/records/{rid}")
    if (i+1) % 100 == 0:
        print(f"  已删除 {i+1}/{len(dupes)}")

print(f"✅ 完成！删除了 {len(dupes)} 条重复消息")
