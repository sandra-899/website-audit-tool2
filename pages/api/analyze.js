// pages/api/analyze.js
// Server-side: fetches URL content + calls Claude API
// No CORS issues because this runs on the server, not in the browser

const SYSTEM_PROMPT = `你是 EASC Insight™，專門評估台灣 B2B 製造商官網的出口競爭力。
評分必須客觀嚴格——大多數台灣廠商網站約得 35–65 分。

評分標準（總分 100 分）：
品牌信任度 15分：公司背景(0-3), 資歷認證(0-3), 社會證明(0-3), 聯絡透明(0-3), 視覺一致(0-3)
內容清晰度 15分：10秒理解(0-4), 產品描述(0-4), 語言品質(0-4), 買家匹配(0-3)
SEO優化 15分：Meta設定(0-3), 標題結構(0-3), 行動適配(0-3), 關鍵字(0-3), 速度(0-3)
GEO AI辨識 20分：實體定義(0-4), FAQ結構(0-4), 可引用句(0-4), 語意完整(0-4), 名稱一致(0-4)
詢問轉換 15分：CTA可見(0-3), 聯絡多樣(0-3), 多語言(0-3), 詢問誘因(0-3), 展會曝光(0-3)
架構擴充 20分：導覽邏輯(0-4), URL結構(0-4), CMS擴充(0-4), 多語架構(0-4), 自主更新(0-4)

只回傳 JSON，不要任何其他文字或說明：
{"totalScore":0,"tier":"C","tierLabel":"建議全面改版規劃","executiveSummary":"2-3句摘要","categories":[{"id":"brand","name":"品牌信任度","maxScore":15,"score":0,"comment":"具體觀察2句","subScores":[{"name":"公司背景與故事","score":0,"max":3},{"name":"資歷與認證","score":0,"max":3},{"name":"社會證明","score":0,"max":3},{"name":"聯絡資訊透明度","score":0,"max":3},{"name":"視覺一致性","score":0,"max":3}],"improvements":["建議1","建議2"]},{"id":"content","name":"內容清晰度","maxScore":15,"score":0,"comment":"具體觀察","subScores":[{"name":"10秒理解度","score":0,"max":4},{"name":"產品描述完整性","score":0,"max":4},{"name":"語言品質","score":0,"max":4},{"name":"目標買家匹配度","score":0,"max":3}],"improvements":["建議1","建議2"]},{"id":"seo","name":"SEO 優化","maxScore":15,"score":0,"comment":"具體觀察","subScores":[{"name":"Meta tags設定","score":0,"max":3},{"name":"標題結構","score":0,"max":3},{"name":"行動裝置適配","score":0,"max":3},{"name":"關鍵字佈局","score":0,"max":3},{"name":"頁面速度判斷","score":0,"max":3}],"improvements":["建議1","建議2"]},{"id":"geo","name":"GEO（AI可辨識度）","maxScore":20,"score":0,"comment":"具體觀察","subScores":[{"name":"實體定義清晰度","score":0,"max":4},{"name":"FAQ/問答結構","score":0,"max":4},{"name":"可引用句","score":0,"max":4},{"name":"語意完整度","score":0,"max":4},{"name":"品牌名稱一致性","score":0,"max":4}],"improvements":["建議1","建議2"]},{"id":"conversion","name":"詢問轉換能力","maxScore":15,"score":0,"comment":"具體觀察","subScores":[{"name":"CTA可見性","score":0,"max":3},{"name":"聯絡管道多樣性","score":0,"max":3},{"name":"多語言支援","score":0,"max":3},{"name":"詢問誘因","score":0,"max":3},{"name":"展會曝光","score":0,"max":3}],"improvements":["建議1","建議2"]},{"id":"architecture","name":"網站架構與擴充性","maxScore":20,"score":0,"comment":"具體觀察","subScores":[{"name":"導覽邏輯","score":0,"max":4},{"name":"URL結構","score":0,"max":4},{"name":"CMS擴充性","score":0,"max":4},{"name":"多語言架構","score":0,"max":4},{"name":"自主更新能力","score":0,"max":4}],"improvements":["建議1","建議2"]}],"top3Issues":["問題1","問題2","問題3"],"rebuildPlan":[{"phase":"第一階段（1–2個月）","focus":"重點","actions":["行動1","行動2","行動3"]},{"phase":"第二階段（3–4個月）","focus":"重點","actions":["行動1","行動2"]},{"phase":"第三階段（5–6個月）","focus":"重點","actions":["行動1","行動2"]}]}`;

// ── HTML parser (no external deps) ──────────────────────────────────────────
function parseHtml(html) {
  const strip = s => s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#\d+;/g,' ')
    .replace(/\s+/g, ' ').trim();

  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  const getAll = (h, tag) =>
    [...h.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi'))]
      .map(m => strip(m[1])).filter(s => s.length > 2);

  const getMeta = (h, ...names) => {
    for (const name of names) {
      const m = h.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']{5,})["']`, 'i'))
             || h.match(new RegExp(`<meta[^>]*content=["']([^"']{5,})["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
      if (m?.[1]) return m[1];
    }
    return '';
  };

  const body = strip(clean);

  return {
    title:    strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''),
    meta:     getMeta(html, 'description', 'og:description'),
    keywords: getMeta(html, 'keywords'),
    h1:       getAll(clean, 'h1').slice(0, 4).join(' | '),
    h2:       getAll(clean, 'h2').slice(0, 8).join(' | '),
    hasForm:  /<form|input[^>]*type=["']email|input[^>]*type=["']tel/i.test(html),
    hasLang:  /href=["'][^"']*\/en\/|href=["'][^"']*\/zh\/|hreflang|lang=["']en/i.test(html),
    hasFAQ:   /\bfaq\b|常見問題|q&a/i.test(body),
    body:     body.slice(0, 3000),
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Allow cross-origin requests so easc.com.tw can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const cleanUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  // ── Step 1: Fetch website content (server-side — no CORS restrictions) ────
  let pageContent = null;
  try {
    const resp = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (resp.ok) {
      const html = await resp.text();
      const parsed = parseHtml(html);
      if (parsed.body.length > 100) pageContent = parsed;
    }
  } catch (e) {
    console.log('[EASC] Fetch failed:', e.message);
  }

  // ── Step 2: Build prompt ──────────────────────────────────────────────────
  const pageBlock = pageContent
    ? `頁面標題：${pageContent.title}
Meta描述：${pageContent.meta}
Meta關鍵字：${pageContent.keywords}
H1標題：${pageContent.h1}
H2標題：${pageContent.h2}
有聯絡表單：${pageContent.hasForm}
有多語言切換：${pageContent.hasLang}
有FAQ頁面：${pageContent.hasFAQ}
---內文（前3000字）---
${pageContent.body}`
    : `（無法直接抓取頁面內容，請根據網址域名、行業特性及同類型網站的一般水準進行評估）`;

  // ── Step 3: Call Claude API ───────────────────────────────────────────────
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `請評估此網站：${cleanUrl}\n\n${pageBlock}` }],
    });

    const raw = message.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    let jsonStr = raw.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
    if (!jsonStr.startsWith('{')) {
      const m = jsonStr.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('No JSON found in response');
      jsonStr = m[0];
    }

    const result = JSON.parse(jsonStr);
    result.contentFetched = !!pageContent;
    return res.status(200).json(result);

  } catch (err) {
    console.error('[EASC] API error:', err.message);
    return res.status(500).json({
      error: err.message,
      hint: 'Check ANTHROPIC_API_KEY environment variable',
    });
  }
}
