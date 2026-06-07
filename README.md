# EASC Insight™ — 網站出口競爭力診斷工具

輸入任何企業網址，AI 自動抓取頁面內容，依據 6 大指標評分（總分 100 分）。

## 部署到 Vercel（5 分鐘）

### 步驟 1：取得 Anthropic API Key
1. 前往 https://console.anthropic.com
2. 登入後點選 **API Keys** → **Create Key**
3. 複製 API Key（格式：`sk-ant-api03-...`）

### 步驟 2：上傳到 GitHub
1. 在 GitHub 建立新的 Repository（Private 即可）
2. 將本專案的所有檔案上傳到 Repository

   **或使用 Git 指令：**
   ```bash
   cd easc-insight-app
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的帳號/easc-insight.git
   git push -u origin main
   ```

### 步驟 3：部署到 Vercel
1. 前往 https://vercel.com，用 GitHub 帳號登入
2. 點選 **Add New Project** → 選擇剛才建立的 Repository
3. 在 **Environment Variables** 加入：
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-...`（步驟 1 的 Key）
4. 點選 **Deploy**，等待約 1-2 分鐘
5. 部署完成後，Vercel 會給你一個網址，如：`easc-insight.vercel.app`

### 步驟 4：測試
開啟 Vercel 給的網址，輸入任何企業網址（如 `easc.com.tw`），點診斷即可。

---

## 本機開發

```bash
# 安裝套件
npm install

# 建立環境變數檔
cp .env.example .env.local
# 編輯 .env.local，填入您的 ANTHROPIC_API_KEY

# 啟動開發伺服器
npm run dev
# 開啟 http://localhost:3000
```

---

## 整合到現有網站（easc.com.tw）

### 方法 A：嵌入 iframe（最簡單）
在您的 WordPress 或任何 HTML 頁面中加入：
```html
<iframe 
  src="https://your-app.vercel.app" 
  width="100%" 
  height="800px"
  style="border: none; border-radius: 12px;"
></iframe>
```

### 方法 B：API 整合（最靈活）
您的網站前端可以直接呼叫 Vercel 上的 API：
```javascript
const response = await fetch('https://your-app.vercel.app/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://target-website.com' }),
});
const result = await response.json();
// result.totalScore, result.categories, result.top3Issues...
```
API 已設定 CORS 標頭，可以從任何網域呼叫。

### 方法 C：自訂域名
在 Vercel 的 Settings → Domains，加入您自己的子網域，如：
`insight.easc.com.tw`

---

## 評分標準

| 類別 | 配分 |
|------|------|
| 品牌信任度 | 15 |
| 內容清晰度 | 15 |
| SEO 優化 | 15 |
| GEO（AI 可辨識度）| 20 |
| 詢問轉換能力 | 15 |
| 網站架構與擴充性 | 20 |
| **總分** | **100** |

## 等級說明
- **A（80–100）**：已具出口市場競爭力
- **B（60–79）**：需要局部補強
- **C（40–59）**：建議全面改版規劃
- **D（0–39）**：網站未達基本門檻

---

Built by EASC Insight™ · Euro-Asia Synergy Corp · easc.com.tw
