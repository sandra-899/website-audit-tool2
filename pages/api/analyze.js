// pages/api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: '請提供網址' });
  }

  try {
    // 1. 嘗試抓取網站內容
    let htmlContent = '';
    let contentFetched = true;
    
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?'
    ];

    for (const proxy of proxies) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(proxy + encodeURIComponent(url), {
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (response.ok) {
          htmlContent = await response.text();
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!htmlContent) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.ok) htmlContent = await response.text();
      } catch (e) {}
    }

    if (!htmlContent) {
      contentFetched = false;
      htmlContent = `[無法直接讀取網站內容]\n網址：${url}`;
    } else {
      htmlContent = htmlContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 6000);
    }

    // 2. 呼叫 DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '伺服器未設定 DEEPSEEK_API_KEY' });
    }

    const systemPrompt = `你是一位專業的網站分析與數位策略顧問，專精於 SEO、UI/UX、轉換率優化以及 AI 時代的網站可讀性（GEO）。

請根據提供的網站資訊，進行詳細分析。回傳嚴格的 JSON 格式。

分析六大構面（每項0-20分，各構面滿分依權重不同）：
- brand（品牌信任度，權重15分）：SSL、聯絡資訊、隱私權政策、社群連結、第三方評價
- content（內容清晰度，權重15分）：價值主張、H標籤結構、文字易讀性、多媒體輔助
- seo（SEO優化，權重15分）：Title/Description、結構化資料、圖片Alt、內鏈
- geo（GEO/AI可辨識度，權重20分）：FAQ標記、語意標籤、文字是否藏在圖片中、實體名詞明確性
- conversion（轉換能力，權重15分）：CTA明顯度、表單設計、即時客服、社會證明
- architecture（網站架構，權重20分）：RWD/Viewport、載入速度、程式碼現代化程度、安全標頭

回傳格式（嚴格的JSON）：
{
  "totalScore": 0-100（加權後總分）,
  "tier": "A"|"B"|"C"|"D",
  "executiveSummary": "一段2-3句的整體評估總結",
  "contentFetched": true/false,
  "categories": [
    {
      "id": "brand",
      "name": "品牌信任度",
      "score": 0-20（原始分數）,
      "maxScore": 20,
      "comment": "對這個構面的簡短評語",
      "subScores": [
        {"name": "SSL安全憑證", "score": 0-5, "max": 5},
        {"name": "聯絡資訊完整度", "score": 0-5, "max": 5},
        {"name": "隱私權政策", "score": 0-5, "max": 5},
        {"name": "社群連結與評價", "score": 0-5, "max": 5}
      ],
      "improvements": ["具體改善建議1", "具體改善建議2"]
    },
    ...其他五個構面，格式相同
  ],
  "top3Issues": ["最優先改善項目1", "第二優先項目2", "第三優先項目3"],
  "rebuildPlan": [
    {
      "phase": "第一階段：XXX（建議1-2週內完成）",
      "focus": "此階段重點",
      "actions": ["具體行動1", "具體行動2", "具體行動3"]
    },
    {
      "phase": "第二階段：XXX（建議1個月內完成）",
      "focus": "此階段重點",
      "actions": ["具體行動1", "具體行動2"]
    },
    {
      "phase": "第三階段：XXX（長期規劃）",
      "focus": "此階段重點",
      "actions": ["具體行動1", "具體行動2"]
    }
  ]
}`;

    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `請分析網站：${url}\n\n網站內容：\n${htmlContent}` }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!deepseekRes.ok) {
      const errData = await deepseekRes.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'DeepSeek API 呼叫失敗');
    }

    const deepseekData = await deepseekRes.json();
    const result = JSON.parse(deepseekData.choices[0].message.content);

    // 確保 contentFetched 正確
    result.contentFetched = contentFetched;

    return res.status(200).json(result);

  } catch (error) {
    console.error('分析失敗：', error);
    return res.status(500).json({ error: error.message || '分析失敗，請稍後再試' });
  }
}
