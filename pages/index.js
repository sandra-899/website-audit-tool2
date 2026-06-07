// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

// ── SVG Gauge ─────────────────────────────────────────────────────────────────
function Gauge({ score, anim }) {
  const S = 180, R = 70, C = 2 * Math.PI * R;
  const col = score >= 80 ? '#059669' : score >= 60 ? '#2563EB' : score >= 40 ? '#D97706' : '#DC2626';
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <circle cx={S/2} cy={S/2} r={R} fill="none" stroke="#F1F5F9" strokeWidth="13"/>
      <circle cx={S/2} cy={S/2} r={R} fill="none" stroke={col} strokeWidth="13"
        strokeDasharray={`${anim ? (score/100)*C : 0} ${C}`} strokeLinecap="round"
        transform={`rotate(-90 ${S/2} ${S/2})`}
        style={{transition:'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)'}}/>
      <text x={S/2} y={S/2-4} textAnchor="middle" fontSize="40" fontWeight="800" fill={col} fontFamily="Sora,sans-serif">{score}</text>
      <text x={S/2} y={S/2+20} textAnchor="middle" fontSize="12" fill="#94A3B8" fontFamily="Sora,sans-serif">/ 100</text>
    </svg>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CAT = {
  brand:        {icon:'🏆', col:'#4F46E5'},
  content:      {icon:'📝', col:'#7C3AED'},
  seo:          {icon:'🔍', col:'#BE185D'},
  geo:          {icon:'🤖', col:'#0369A1'},
  conversion:   {icon:'📬', col:'#047857'},
  architecture: {icon:'🏗️', col:'#B45309'},
};
const TIER = {
  A:{col:'#059669',bg:'#D1FAE5',label:'已具出口市場競爭力'},
  B:{col:'#2563EB',bg:'#DBEAFE',label:'需要局部補強'},
  C:{col:'#D97706',bg:'#FEF3C7',label:'建議全面改版規劃'},
  D:{col:'#DC2626',bg:'#FEE2E2',label:'網站未達基本門檻'},
};
const sc = (s,m) => s/m>=0.8?'#059669':s/m>=0.6?'#2563EB':s/m>=0.4?'#D97706':'#DC2626';
const sl = (s,m) => s/m>=0.8?'優秀':s/m>=0.6?'良好':s/m>=0.4?'待改善':'急需優化';

// ── Main App ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [url,      setUrl]      = useState('');
  const [screen,   setScreen]   = useState('home');
  const [result,   setResult]   = useState(null);
  const [errMsg,   setErrMsg]   = useState('');
  const [anim,     setAnim]     = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (result) { const t = setTimeout(() => setAnim(true), 350); return () => clearTimeout(t); }
  }, [result]);

  const go = async () => {
    if (!url.trim()) return;
    setScreen('loading'); setErrMsg(''); setAnim(false); setExpanded(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (typeof data.totalScore !== 'number') throw new Error('分析結果格式錯誤，請重試');
      setResult(data);
      setScreen('result');
    } catch (e) {
      setErrMsg(e.message);
      setScreen('home');
    }
  };

  const reset = () => { setScreen('home'); setResult(null); setErrMsg(''); setExpanded(null); setAnim(false); };

  // ── HOME ───────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <>
      <Head>
        <title>EASC Insight™ – 網站出口競爭力診斷</title>
        <meta name="description" content="輸入網址，AI 依據 6 大指標評估您官網的出口市場競爭力"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet"/>
      </Head>
      <style>{globalCss}</style>

      <header className="header">
        <span className="logo">EASC Insight™</span>
        <span className="logo-sub">by Euro-Asia Synergy Corp</span>
      </header>

      <main className="home-main">
        <div className="badge">AI 驅動 · 免費診斷</div>
        <h1 className="h1">您的官網能讓海外買家<br/>主動找到您嗎？</h1>
        <p className="sub">輸入企業官網網址，AI 自動抓取內容<br/>依據 6 大指標評分，60 秒找出出口競爭力缺口</p>

        <div className="input-wrap">
          <div className="input-row">
            <div style={{flex:1,position:'relative'}}>
              <span className="globe">🌐</span>
              <input className="url-input"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && go()}
                placeholder="www.your-company.com.tw"
              />
            </div>
            <button className="btn-primary" onClick={go}>診斷 →</button>
          </div>
          {errMsg && <div className="error-box">⚠️ {errMsg}</div>}
          <p className="hint">支援任何公開網站 · AI 自動抓取分析 · 資料不儲存</p>
        </div>

        <div className="pills">
          {[['🏆','品牌信任度','15'],['📝','內容清晰度','15'],['🔍','SEO 優化','15'],
            ['🤖','GEO 可辨識度','20'],['📬','詢問轉換','15'],['🏗️','架構擴充','20']].map(([ic,n,p])=>(
            <div key={n} className="pill">
              <span>{ic}</span><span>{n}</span><span className="pill-pts">{p}分</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (screen === 'loading') return (
    <>
      <Head><title>分析中… – EASC Insight™</title></Head>
      <style>{globalCss}</style>
      <div className="loading-screen">
        <div className="spinner"/>
        <p className="loading-title">AI 正在分析您的網站…</p>
        <p className="loading-url">{/^https?:\/\//i.test(url) ? url : `https://${url}`}</p>
        <p className="loading-hint">正在抓取頁面內容並評估 6 大指標，約需 20–40 秒</p>
      </div>
    </>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  const ti   = TIER[result?.tier] ?? TIER.C;
  const cats = result?.categories ?? [];
  const displayUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  return (
    <>
      <Head><title>診斷報告 – {url} – EASC Insight™</title></Head>
      <style>{globalCss}</style>

      <header className="header">
        <span className="logo">EASC Insight™</span>
        <button className="btn-ghost" onClick={reset}>← 重新評估</button>
      </header>

      <main style={{maxWidth:760,margin:'0 auto',padding:'18px 16px 64px'}}>

        {/* Content fetch notice */}
        {result.contentFetched === false && (
          <div className="notice-box">
            ℹ️ 此網站有防爬設定，無法直接抓取頁面，AI 依據網址特性與行業知識進行評估，準確度略低。
          </div>
        )}

        {/* Score card */}
        <div className="card score-card">
          <p className="url-label">{displayUrl}</p>
          <div className="gauge-wrap"><Gauge score={result.totalScore} anim={anim}/></div>
          <div className="tier-badge" style={{background:ti.bg,color:ti.col}}>
            {result.tier} 級 · {ti.label}
          </div>
          <p className="summary">{result.executiveSummary}</p>
        </div>

        {/* Category grid */}
        <h2 className="section-title">📊 六大指標評分 <span className="section-hint">點選卡片查看子指標與改善建議</span></h2>
        <div className="cat-grid">
          {cats.map((cat, idx) => {
            const meta  = CAT[cat.id] ?? CAT.brand;
            const isEx  = expanded === cat.id;
            const color = sc(cat.score, cat.maxScore);
            return (
              <div key={cat.id} className="cat-card"
                onClick={() => setExpanded(isEx ? null : cat.id)}
                style={{
                  borderTop:`3px solid ${meta.col}`,
                  border: isEx ? `1px solid ${meta.col}` : '1px solid #E5E7EB',
                  boxShadow: isEx ? `0 4px 20px rgba(0,0,0,.1)` : '0 1px 4px rgba(0,0,0,.05)',
                  gridColumn: isEx ? '1/-1' : 'auto',
                  borderTopColor: meta.col,
                  animationDelay:`${idx*.06}s`,
                }}
              >
                <div className="cat-header">
                  <div className="cat-name"><span>{meta.icon}</span><span>{cat.name}</span></div>
                  <div className="cat-score">
                    <span style={{fontSize:22,fontWeight:800,color}}>{cat.score}</span>
                    <span style={{fontSize:11,color:'#94A3B8'}}>/{cat.maxScore}</span>
                  </div>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{
                    width: anim ? `${(cat.score/cat.maxScore)*100}%` : '0%',
                    background: color,
                    transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${idx*.08}s`,
                  }}/>
                </div>
                <div className="cat-footer">
                  <span style={{fontSize:11,color,fontWeight:500}}>{sl(cat.score,cat.maxScore)}</span>
                  <span style={{fontSize:10,color:'#94A3B8'}}>{isEx ? '▲ 收合' : '▼ 展開明細'}</span>
                </div>

                {isEx && (
                  <div className="cat-detail">
                    <p className="cat-comment">{cat.comment}</p>

                    {/* Sub-scores */}
                    <div className="sub-section">
                      <div className="sub-title" style={{color:meta.col}}>子指標明細</div>
                      {(cat.subScores ?? []).map(sub => (
                        <div key={sub.name} className="sub-row">
                          <div className="sub-label">
                            <span>{sub.name}</span>
                            <span style={{fontWeight:600,color:sc(sub.score,sub.max)}}>{sub.score}/{sub.max}</span>
                          </div>
                          <div className="bar-bg" style={{height:4,marginBottom:0}}>
                            <div className="bar-fill" style={{width:`${(sub.score/sub.max)*100}%`,background:sc(sub.score,sub.max)}}/>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Improvements */}
                    <div className="imp-section">
                      <div className="sub-title">改善行動建議</div>
                      {(cat.improvements ?? []).map((imp,i) => (
                        <div key={i} className="imp-item">
                          <span className="imp-arrow" style={{color:meta.col}}>→</span>
                          <span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Top 3 Issues */}
        <div className="issues-card">
          <h3 className="issues-title">🚨 三大優先改善項目</h3>
          {(result.top3Issues ?? []).map((issue, i) => (
            <div key={i} className="issue-row">
              <div className="issue-num" style={{background:['#DC2626','#D97706','#2563EB'][i]}}>{i+1}</div>
              <span className="issue-text">{issue}</span>
            </div>
          ))}
        </div>

        {/* Rebuild Plan */}
        <div className="card" style={{padding:20}}>
          <h3 className="issues-title" style={{color:'#0B2D46',marginBottom:18}}>🗺️ 改版規劃路線圖</h3>
          {(result.rebuildPlan ?? []).map((ph, i) => {
            const phC = [['#4F46E5','#EEF2FF'],['#0369A1','#E0F2FE'],['#047857','#D1FAE5']];
            const [pc,pb] = phC[i] ?? phC[0];
            const last = i === (result.rebuildPlan.length - 1);
            return (
              <div key={i} className="phase-row" style={{marginBottom: last ? 0 : 18}}>
                <div className="phase-timeline">
                  <div className="phase-dot" style={{background:pb,border:`2px solid ${pc}`,color:pc}}>{i+1}</div>
                  {!last && <div className="phase-line"/>}
                </div>
                <div className="phase-content">
                  <div className="phase-name">{ph.phase}</div>
                  <div className="phase-focus" style={{color:pc}}>重點：{ph.focus}</div>
                  {(ph.actions ?? []).map((a,j) => (
                    <div key={j} className="phase-action">
                      <span style={{color:'#CBD5E1'}}>◦</span><span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="footer-text">EASC Insight™ · Euro-Asia Synergy Corp · easc.com.tw</p>
      </main>
    </>
  );
}

// ── Global CSS ────────────────────────────────────────────────────────────────
const globalCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-family: 'Sora', 'Noto Sans TC', -apple-system, sans-serif; }
  body { background: #EEF3FB; color: #1E293B; }

  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

  .header {
    background: #0B2D46; padding: 13px 24px;
    display: flex; align-items: baseline; gap: 10px;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,.25);
    justify-content: space-between;
  }
  .logo      { font-size: 17px; font-weight: 800; color: white; letter-spacing: -.3px; }
  .logo-sub  { font-size: 11px; color: #5BAABF; }
  .btn-ghost { font-size: 12px; color: #7FBFDB; background: transparent;
               border: 1px solid rgba(127,191,219,.3); border-radius: 6px;
               padding: 5px 12px; cursor: pointer; font-family: inherit; }

  /* HOME */
  .home-main { text-align: center; padding: 56px 20px 48px; max-width: 640px; margin: 0 auto; }
  .badge     { display: inline-block; padding: 4px 16px; background: rgba(3,105,161,.08);
               border-radius: 20px; font-size: 11px; font-weight: 600; color: #0369A1;
               letter-spacing: 1.5px; margin-bottom: 18px; animation: fadeUp .4s ease both; }
  .h1        { font-size: clamp(22px,5vw,32px); font-weight: 800; color: #0B2D46;
               margin-bottom: 14px; line-height: 1.3;
               animation: fadeUp .4s ease both; animation-delay: .05s; }
  .sub       { font-size: 14px; color: #64748B; line-height: 1.75; margin-bottom: 40px;
               animation: fadeUp .4s ease both; animation-delay: .1s; }
  .input-wrap { max-width: 480px; margin: 0 auto; animation: fadeUp .4s ease both; animation-delay: .15s; }
  .input-row  { display: flex; gap: 8px; margin-bottom: 10px; }
  .globe      { position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
               font-size: 16px; pointer-events: none; }
  .url-input  { width: 100%; padding: 13px 14px 13px 42px; font-size: 14px;
               border: 2px solid #E2E8F0; border-radius: 10px; font-family: inherit;
               color: #0F172A; background: white; transition: border-color .2s, box-shadow .2s;
               outline: none; }
  .url-input:focus { border-color: #0369A1; box-shadow: 0 0 0 3px rgba(3,105,161,.12); }
  .btn-primary { padding: 13px 20px; background: #0B2D46; color: white; border: none;
                border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
                font-family: inherit; white-space: nowrap; transition: background .2s; }
  .btn-primary:hover { background: #0D3B5E; }
  .error-box  { padding: 10px 14px; background: #FEE2E2; border-radius: 8px;
               color: #B91C1C; font-size: 12px; text-align: left; margin-bottom: 8px; }
  .hint       { font-size: 11px; color: #94A3B8; }
  .pills      { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center;
               max-width: 500px; margin: 36px auto 0;
               animation: fadeUp .4s ease both; animation-delay: .2s; }
  .pill       { padding: 7px 12px; background: white; border-radius: 20px;
               border: 1px solid #E5E7EB; font-size: 12px; color: #374151;
               display: flex; align-items: center; gap: 5px; }
  .pill-pts   { color: #94A3B8; font-weight: 600; }

  /* LOADING */
  .loading-screen { min-height: 100vh; background: #0B2D46;
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; padding: 40px 24px; text-align: center; }
  .spinner        { width: 52px; height: 52px; border: 3px solid rgba(255,255,255,.08);
                    border-top: 3px solid #5BAABF; border-radius: 50%;
                    animation: spin .85s linear infinite; margin-bottom: 28px; }
  .loading-title  { color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .loading-url    { color: #5BAABF; font-size: 12px; margin-bottom: 16px;
                    max-width: 320px; word-break: break-all; }
  .loading-hint   { color: rgba(255,255,255,.3); font-size: 11px; }

  /* RESULT */
  .card       { background: white; border-radius: 12px; border: 1px solid #E5E7EB;
               box-shadow: 0 1px 5px rgba(0,0,0,.05); }
  .notice-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px;
               padding: 10px 14px; font-size: 12px; color: #1D4ED8;
               margin-bottom: 12px; line-height: 1.6; }
  .score-card { padding: 24px 20px 20px; margin-bottom: 14px; text-align: center; animation: fadeUp .4s ease; }
  .url-label  { font-size: 11px; color: #94A3B8; margin-bottom: 10px; word-break: break-all; }
  .gauge-wrap { display: flex; justify-content: center; margin: 4px 0 12px; }
  .tier-badge { display: inline-block; padding: 5px 20px; border-radius: 20px;
               font-size: 13px; font-weight: 700; margin-bottom: 14px; }
  .summary    { font-size: 13px; color: #475569; line-height: 1.8; max-width: 500px; margin: 0 auto; }
  .section-title { font-size: 12px; font-weight: 600; color: #374151;
                  margin-bottom: 8px; padding-left: 2px; }
  .section-hint  { font-weight: 400; color: #94A3B8; font-size: 11px; }
  .cat-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .cat-card   { background: white; border-radius: 12px; padding: 14px; cursor: pointer;
               transition: border-color .2s, box-shadow .2s;
               animation: fadeUp .4s ease both; }
  .cat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .cat-name   { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #1E293B; }
  .cat-score  { text-align: right; }
  .bar-bg     { height: 5px; background: #F1F5F9; border-radius: 3px; overflow: hidden; margin-bottom: 5px; }
  .bar-fill   { height: 100%; border-radius: 3px; }
  .cat-footer { display: flex; justify-content: space-between; align-items: center; }
  .cat-detail { border-top: 1px solid #F1F5F9; margin-top: 12px; padding-top: 12px; }
  .cat-comment { font-size: 12px; color: #475569; line-height: 1.75; margin-bottom: 14px; }
  .sub-section { margin-bottom: 14px; }
  .sub-title   { font-size: 10px; font-weight: 700; margin-bottom: 8px;
                letter-spacing: .8px; text-transform: uppercase; }
  .sub-row    { margin-bottom: 7px; }
  .sub-label  { display: flex; justify-content: space-between; font-size: 11px; color: #64748B; margin-bottom: 3px; }
  .imp-section { }
  .imp-item   { font-size: 12px; color: #334155; margin-bottom: 6px;
               display: flex; gap: 7px; line-height: 1.65; }
  .imp-arrow  { flex-shrink: 0; font-weight: 700; }
  .issues-card { background: #FFFBF0; border-radius: 12px; border: 1px solid #FDE68A;
                padding: 16px; margin-bottom: 14px; }
  .issues-title { font-size: 13px; font-weight: 700; color: #92400E; margin-bottom: 14px; }
  .issue-row  { display: flex; gap: 11px; margin-bottom: 10px; align-items: flex-start; }
  .issue-row:last-child { margin-bottom: 0; }
  .issue-num  { width: 24px; height: 24px; border-radius: 50%; color: white;
               display: flex; align-items: center; justify-content: center;
               font-size: 11px; font-weight: 800; flex-shrink: 0; }
  .issue-text { font-size: 12px; color: #7C2D12; line-height: 1.75; }
  .phase-row     { display: flex; gap: 12px; }
  .phase-timeline { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .phase-dot     { width: 28px; height: 28px; border-radius: 50%;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 12px; font-weight: 800; }
  .phase-line    { width: 1px; flex: 1; background: #E5E7EB; margin: 4px 0; }
  .phase-content { padding-bottom: 4px; }
  .phase-name    { font-size: 12px; font-weight: 700; color: #1E293B; margin-bottom: 2px; }
  .phase-focus   { font-size: 11px; font-weight: 600; margin-bottom: 7px; }
  .phase-action  { font-size: 11px; color: #475569; margin-bottom: 4px; display: flex; gap: 6px; }
  .footer-text   { text-align: center; margin-top: 28px; font-size: 11px; color: #94A3B8; }

  @media (max-width: 480px) {
    .cat-grid { grid-template-columns: 1fr; }
    .input-row { flex-direction: column; }
    .btn-primary { width: 100%; text-align: center; }
  }
`;
