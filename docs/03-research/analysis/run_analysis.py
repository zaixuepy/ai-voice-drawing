import pandas as pd
import os
import jieba
from wordcloud import WordCloud
import matplotlib.pyplot as plt
from snownlp import SnowNLP
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from collections import Counter
import matplotlib
matplotlib.use('Agg')

# ================= 配置 =================
DATA_DIR = "/Users/zhangyuxiang/Downloads/xhs_analysis_data"
STOPWORDS_FILE = os.path.join(DATA_DIR, "stopwords.txt")
OUTPUT_DIR = os.path.join(DATA_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ================= 停用词 =================
SCIENTIFIC_STOPWORDS = """
没有 看到 不是 请问 一起 知道 有没有 不能 是不是 进去 很多 一场 有点 可能 一次 的话 好像 看看 有人 不要 超级 今天 的 了 是 我 你 他 在 就 不 人 都 一 一个 上 也 很 到 说 要 去 会 着 看 好 自己 这 那 有
朋友 手机 衣服 宝宝 老师 体验
喜欢 好看 失望 哈哈哈哈 啊啊啊 嘻嘻 呜呜
飞吻 石化 皱眉 色色 萌萌 派对
如果 只能 不到 出来 这是 不了 你们 不好 别人 根本 结束
昨天 今晚 晚上 第一次 看过 去过 下次 两个
汗颜 抓狂 生气 暗中 观察
不过 完全 谢谢 你好 问问 其他 为啥 每次 几个
活动 今年 好好 开心 好玩 点赞
建议 感觉 真的 就是 觉得 什么 怎么 这个 那个 现在 然后
因为 所以 但是 而且 虽然 可以 已经 还是 比较
有点 各种 直接 很多 特别 真的 真的 目前 一般
"""

def setup_stopwords():
    existing = set()
    if os.path.exists(STOPWORDS_FILE):
        with open(STOPWORDS_FILE, 'r', encoding='utf-8') as f:
            existing = set(line.strip() for line in f if line.strip())
    new_count = 0
    for line in SCIENTIFIC_STOPWORDS.split('\n'):
        for w in line.strip().split():
            if w and w not in existing:
                existing.add(w)
                new_count += 1
    with open(STOPWORDS_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sorted(existing)))
    print(f"停用词: {len(existing)} 个 (新增 {new_count})")
    return existing

STOP_WORDS = setup_stopwords()

# ================= 字体 =================
def get_font():
    for path in [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf"
    ]:
        if os.path.exists(path):
            return path
    return None

FONT_PATH = get_font()
print(f"字体: {FONT_PATH}")

# ================= 加载数据 =================
print("\n" + "="*60)
print("1. 加载数据")
print("="*60)

# 评论数据
comments_df = pd.read_csv(
    os.path.join(DATA_DIR, "search_comments_2026-06-13.csv"),
    encoding='utf-8-sig', on_bad_lines='skip'
)
comments_df = comments_df[['content', 'ip_location', 'nickname', 'like_count']].copy()
comments_df['source'] = 'comment'
comments_df.rename(columns={'like_count': 'liked_count'}, inplace=True)

# 内容数据 - 合并 title + desc
contents_df = pd.read_csv(
    os.path.join(DATA_DIR, "search_contents_2026-06-13.csv"),
    encoding='utf-8-sig', on_bad_lines='skip'
)
contents_df['content'] = contents_df['title'].fillna('') + ' ' + contents_df['desc'].fillna('')
contents_df = contents_df[['content', 'ip_location', 'nickname', 'liked_count', 'source_keyword']].copy()
contents_df['source'] = 'note'
contents_df['liked_count'] = pd.to_numeric(contents_df['liked_count'], errors='coerce').fillna(0)

# 合并
all_df = pd.concat([comments_df, contents_df], ignore_index=True)
all_df.dropna(subset=['content'], inplace=True)
all_df['content'] = all_df['content'].astype(str)
all_df.drop_duplicates(subset=['content'], inplace=True)
all_df = all_df[all_df['content'].str.len() > 1]

print(f"评论数据: {len(comments_df)} 条")
print(f"内容数据: {len(contents_df)} 条")
print(f"合并有效数据: {len(all_df)} 条")

# ================= 词频分析 =================
print("\n" + "="*60)
print("2. 高频词分析 (Top 50)")
print("="*60)

all_words = []
for text in all_df['content']:
    words = jieba.lcut(text)
    for w in words:
        w = w.strip()
        if len(w) > 1 and w not in STOP_WORDS:
            all_words.append(w)

counter = Counter(all_words)
print(f"{'排名':<6} {'词语':<12} {'出现次数':<10}")
print("-"*40)
for i, (word, count) in enumerate(counter.most_common(50)):
    print(f"{i+1:<6} {word:<12} {count:<10}")

# ================= 情感分析 =================
print("\n" + "="*60)
print("3. 情感分析 (SnowNLP)")
print("="*60)

all_df['sentiment'] = all_df['content'].apply(lambda x: SnowNLP(str(x)).sentiments)

negative_df = all_df[all_df['sentiment'] < 0.35]
neutral_df = all_df[(all_df['sentiment'] >= 0.35) & (all_df['sentiment'] <= 0.65)]
positive_df = all_df[all_df['sentiment'] > 0.65]

print(f"😊 正面 ({len(positive_df)} 条, {len(positive_df)/len(all_df)*100:.1f}%)")
print(f"😐 中性 ({len(neutral_df)} 条, {len(neutral_df)/len(all_df)*100:.1f}%)")
print(f"😞 负面 ({len(negative_df)} 条, {len(negative_df)/len(all_df)*100:.1f}%)")

# 负面内容样本
print("\n--- 负面情绪 Top 5 样本 ---")
for i, (_, row) in enumerate(negative_df.nsmallest(5, 'sentiment').iterrows()):
    print(f"{i+1}. [{row['sentiment']:.3f}] {row['content'][:120]}...")

# ================= 地域分布 =================
print("\n" + "="*60)
print("4. 地域分布 (Top 15)")
print("="*60)
geo = all_df[all_df['ip_location'].notna() & (all_df['ip_location'] != '')]
geo_counts = geo['ip_location'].value_counts().head(15)
for loc, cnt in geo_counts.items():
    bar = '█' * int(cnt / geo_counts.max() * 30)
    print(f"  {loc:<10} {cnt:<8} {bar}")

# ================= 词云 =================
print("\n" + "="*60)
print("5. 生成词云图")
print("="*60)

def make_wordcloud(text_list, title, filename):
    if not FONT_PATH:
        print("无可用字体，跳过")
        return
    text_combined = " ".join(text_list)
    words = jieba.cut(text_combined)
    filtered = [w for w in words if len(w) > 1 and w not in STOP_WORDS]
    if not filtered:
        print("词汇不足，跳过")
        return
    wc = WordCloud(
        font_path=FONT_PATH, width=1200, height=800,
        background_color='white', max_words=200, collocations=False
    ).generate(" ".join(filtered))
    plt.figure(figsize=(12, 8))
    plt.imshow(wc, interpolation='bilinear')
    plt.axis("off")
    plt.title(title, fontsize=24, fontproperties='SimHei' if FONT_PATH else None)
    path = os.path.join(OUTPUT_DIR, filename)
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"✅ 已保存: {path}")

make_wordcloud(negative_df['content'].tolist(), "Pain Points - 负面情绪词云", "wordcloud_negative.png")
make_wordcloud(positive_df['content'].tolist(), "Positive Drivers - 正面情绪词云", "wordcloud_positive.png")
make_wordcloud(all_df['content'].tolist(), "All Content - 全量词云", "wordcloud_all.png")

# ================= LDA 主题分析 =================
print("\n" + "="*60)
print("6. LDA 主题分析")
print("="*60)

clean_texts = []
for text in all_df['content']:
    words = jieba.lcut(str(text))
    clean = [w for w in words if len(w) > 1 and w not in STOP_WORDS]
    clean_texts.append(" ".join(clean))

vectorizer = CountVectorizer(max_df=0.95, min_df=3, max_features=1000)
try:
    tf = vectorizer.fit_transform(clean_texts)
except ValueError as e:
    print(f"向量化失败: {e}")
else:
    feature_names = vectorizer.get_feature_names_out()
    for n_topics in [4, 6]:
        print(f"\n--- {n_topics} 个主题 ---")
        lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
        lda.fit(tf)
        for topic_idx, topic in enumerate(lda.components_):
            top_words = [feature_names[i] for i in topic.argsort()[:-11:-1]]
            print(f"  主题{topic_idx+1}: {', '.join(top_words)}")

# ================= 关键词维度对比 =================
print("\n" + "="*60)
print("7. 各关键词情感对比")
print("="*60)

if 'source_keyword' in all_df.columns:
    kw_df = all_df[all_df['source_keyword'].notna() & (all_df['source_keyword'] != '')]
    if not kw_df.empty:
        for kw in kw_df['source_keyword'].unique():
            subset = kw_df[kw_df['source_keyword'] == kw]
            if len(subset) > 5:
                avg_s = subset['sentiment'].mean()
                neg_pct = (subset['sentiment'] < 0.35).mean() * 100
                print(f"  {kw:<12} 数量:{len(subset):<6} 平均情感:{avg_s:.3f}  负面占比:{neg_pct:.1f}%")

# ================= 热点内容 Top 10 =================
print("\n" + "="*60)
print("8. 热议内容 Top 10 (按点赞)")
print("="*60)

all_df['liked_count'] = pd.to_numeric(all_df['liked_count'], errors='coerce').fillna(0)
top_content = all_df.nlargest(10, 'liked_count')
for i, (_, row) in enumerate(top_content.iterrows()):
    print(f"{i+1}. [赞:{row['liked_count']:.0f}] [{row['source']}] {row['content'][:100]}...")

# ================= 导出完整数据 =================
output_file = os.path.join(OUTPUT_DIR, "full_analysis_data.xlsx")
all_df.to_excel(output_file, index=False)
print(f"\n✅ 全量数据已导出: {output_file}")

# 导出统计摘要
summary_path = os.path.join(OUTPUT_DIR, "analysis_summary.txt")
with open(summary_path, 'w', encoding='utf-8') as f:
    f.write("="*60 + "\n")
    f.write("小红书舆情分析摘要\n")
    f.write("="*60 + "\n\n")
    f.write(f"数据量: {len(all_df)} 条 (评论 {len(comments_df)} + 笔记 {len(contents_df)})\n")
    f.write(f"情感分布: 正面 {len(positive_df)} ({len(positive_df)/len(all_df)*100:.1f}%) | ")
    f.write(f"中性 {len(neutral_df)} ({len(neutral_df)/len(all_df)*100:.1f}%) | ")
    f.write(f"负面 {len(negative_df)} ({len(negative_df)/len(all_df)*100:.1f}%)\n\n")
    f.write("高频词 Top 30:\n")
    for i, (word, count) in enumerate(counter.most_common(30)):
        f.write(f"  {i+1}. {word} ({count})\n")
    f.write(f"\n地域 Top 10:\n")
    for loc, cnt in geo_counts.head(10).items():
        f.write(f"  {loc}: {cnt}\n")
    f.write(f"\n热议内容 Top 10:\n")
    for i, (_, row) in enumerate(top_content.iterrows()):
        f.write(f"  {i+1}. [赞:{row['liked_count']:.0f}] {row['content'][:100]}...\n")

print(f"✅ 分析摘要已导出: {summary_path}")
print("\n" + "="*60)
print("🎉 全部分析完成!")
print("="*60)
print(f"输出目录: {OUTPUT_DIR}/")
print(f"  - wordcloud_all.png / wordcloud_negative.png / wordcloud_positive.png")
print(f"  - full_analysis_data.xlsx")
print(f"  - analysis_summary.txt")
