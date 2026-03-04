/* ================= 序列 1：全局基础样式 ================= */
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
body, html { height: 100%; width: 100%; background-color: #1a1a1a; overflow: hidden; }

#app {
    height: 100vh; color: #fff; position: relative;
    background-image: linear-gradient(rgba(35, 45, 55, 0.8), rgba(15, 25, 35, 0.98)), url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080&auto=format&fit=crop');
    background-size: cover; background-position: center; transition: background 0.6s ease;
}
.bg-green { background-image: linear-gradient(to bottom, #394a3d, #1f2b23); }

.view { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; transition: opacity 0.3s ease; }
.view.hidden { opacity: 0; pointer-events: none; z-index: -1; }
.view.active { opacity: 1; pointer-events: all; z-index: 1; }

#home-view { justify-content: space-between; padding: 60px 20px 20px 20px; }
.home-title { text-align: center; font-size: 2.5rem; font-weight: 600; margin-top: 20vh; letter-spacing: 0.5px; }
.cards-container { display: flex; gap: 12px; margin-bottom: 30px; }
.nav-card { flex: 1; background: rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 16px 20px; cursor: pointer; backdrop-filter: blur(10px); }
.nav-card h3 { font-size: 1.1rem; font-weight: 500; margin-bottom: 4px; }
.nav-count { color: #f39c12; font-size: 1.1rem; font-weight: 600; }
.bottom-nav { display: flex; justify-content: space-around; padding: 10px 0; color: rgba(255,255,255,0.4); font-size: 1.2rem; }
.bottom-nav i.active { color: #fff; }

#learning-view { padding: 45px 24px 30px 24px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.6); font-size: 0.95rem; margin-bottom: 40px; }
.top-bar .left { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.top-bar .right { display: flex; gap: 20px; }

.content-area { flex-grow: 1; overflow: hidden; padding-bottom: 80px; }
.word-row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 15px; position: relative; }
#word-pt { font-size: 2.8rem; font-weight: 700; letter-spacing: 0.5px; line-height: 1; }
.success-badge { color: #34c759; font-size: 1.2rem; margin-bottom: 18px; } 

.progress-dots { display: flex; flex-direction: column-reverse; gap: 4px; margin-bottom: 6px; margin-left: 5px; }
.dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: background 0.3s; }
.dot.active { background: #2ecc71; box-shadow: 0 0 4px rgba(46, 204, 113, 0.4); }

.phonetic-row { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.6); font-size: 0.95rem; margin-bottom: 35px; cursor: pointer; }
.accent-tag { background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; color: rgba(255,255,255,0.8); }

.skeleton-bars { margin-bottom: 30px; }
.skeleton-line { height: 16px; background: rgba(255,255,255,0.08); border-radius: 6px; margin-bottom: 8px; }
.skeleton-line.short { width: 45%; }
.skeleton-line.long { width: 30%; }

.hint-text { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-bottom: 24px; text-align: center; }
#definition-area { margin-bottom: 30px; }
.def-line { line-height: 1.6; border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 15px; }
.pos-grey { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-right: 8px; }
.zh-white { font-size: 1.1rem; color: #fff; }

/* ================= 经典的测验区样式 (恢复上下气泡排列，靠左对齐) ================= */
.options-list { 
    display: flex; 
    flex-direction: column; 
    gap: 12px; 
    width: 100%;
}

.option { 
    background: rgba(255, 255, 255, 0.08); 
    border-radius: 14px; 
    padding: 16px 24px; 
    cursor: pointer; 
    min-height: 64px; 
    display: flex; 
    flex-direction: column; 
    justify-content: center; 
    align-items: flex-start; 
    transition: all 0.2s ease; 
    border: 1px solid transparent; 
}
.option:active, .option.active { background: rgba(255, 255, 255, 0.18); } 

.opt-pos { font-size: 0.8rem; color: #2ecc71; margin-bottom: 4px; display: block; font-weight: 500;}
.opt-zh { font-size: 1.05rem; color: #fff; line-height: 1.4; text-align: left;} 

/* === 答错/答对的框体反馈 === */
.option.wrong {
    background-color: rgba(231, 76, 60, 0.12) !important; 
    border: 1px solid rgba(231, 76, 60, 0.4);
}
.option.correct {
    background-color: rgba(46, 204, 113, 0.12) !important; 
    border: 1px solid rgba(46, 204, 113, 0.4);
}

/* === 选错后展示的双语排版 === */
.opt-bilingual { 
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
    align-items: flex-start; 
}
.opt-pt-text { font-size: 1.15rem; font-weight: 600; color: #fff; letter-spacing: 0.5px; }
.opt-zh-text { font-size: 0.9rem; color: rgba(255, 255, 255, 0.6); text-align: left;}

/* ============================================================== */

.card { background: rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 20px; margin-bottom: 12px; }
.sentence-card { background: rgba(255, 255, 255, 0.07); }
.en-text { font-size: 1.05rem; line-height: 1.5; margin-bottom: 8px; }
.en-text strong { font-weight: 600; }
.zh-text { font-size: 0.85rem; color: rgba(255,255,255,0.5); }

/* 右下角带背景的圆形按钮样式 */
.expand-card-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.15); 
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
    z-index: 10;
    -webkit-tap-highlight-color: transparent; 
}
.expand-card-btn:hover,
.expand-card-btn:active { background-color: rgba(255, 255, 255, 0.25); }

#tab-content-container { height: 160px; overflow: hidden; margin-bottom: 15px; }
.phrase-item { margin-bottom: 15px; }
.phrase-item:last-child { margin-bottom: 0; }
.phrase-en { font-size: 0.95rem; margin-bottom: 2px; }
.phrase-zh { font-size: 0.85rem; color: rgba(255,255,255,0.5); }

.card-footer-tabs { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; display: flex; justify-content: space-between; font-size: 0.75rem; color: rgba(255,255,255,0.4); }
.tabs-left { display: flex; gap: 15px; }
.tab { cursor: pointer; transition: color 0.2s; }
.tab.active { color: #fff; font-weight: 500; }
.tabs-right { display: flex; gap: 15px; font-size: 0.85rem; }

.hint-btn-container { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 120px; cursor: pointer; color: rgba(255,255,255,0.5); font-size: 0.8rem; }
.bulb-icon { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 1rem; }
.hint-btn-container:active { color: #fff; }

.bottom-action { display: flex; justify-content: center; position: absolute; bottom: 35px; width: calc(100% - 48px); }
.action-group { width: 100%; display: flex; justify-content: center; }
.dual-btns { justify-content: space-between; padding: 0 40px; }
.action-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; color: rgba(255,255,255,0.8); font-size: 0.95rem; font-weight: 500; padding: 10px; transition: transform 0.1s; }
.action-item:active { transform: scale(0.95); }
.action-item .line { width: 14px; height: 3px; border-radius: 2px; }
.line.red { background-color: #e74c3c; }
.line.green { background-color: #2ecc71; }
.hidden { display: none !important; }

/* ================= 序列 3：沉浸式原生滑动 大卡片专属 ================= */

.immersive-content-wrapper { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; z-index: 2; }
.immersive-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(20, 25, 30, 0.95); z-index: 1; }

.slider-window { width: 100%; overflow: hidden; position: relative; }
.slider-track { display: flex; width: 100%; transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1); }
.slider-slide { flex: 0 0 100%; width: 100%; box-sizing: border-box; }

.immersive-upper { flex: 5; display: flex; flex-direction: column; padding: 50px 0 20px 0; position: relative; }
.upper-header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; margin-bottom: 20px; }
.source-tag { background: rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; color: rgba(255,255,255,0.8); }

#upper-window { flex-grow: 1; display: flex; align-items: center; padding: 0 10px; }
.im-en-sentence { font-size: 1.8rem; line-height: 1.45; font-weight: 700; margin-bottom: 18px; padding: 0 24px; letter-spacing: 0.2px; }
.highlight-yellow { color: #f1c40f; }
.im-zh-sentence { font-size: 1.05rem; color: rgba(255,255,255,0.6); line-height: 1.55; padding: 0 24px; }

/* 核心修改 1：上层例句点点居中 */
.upper-pagination { 
    display: flex; gap: 8px; justify-content: center; padding: 0; margin-bottom: 10px; 
}
.upper-pagination .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.25); transition: background 0.3s; }
.upper-pagination .dot.active { background: #fff; }

/* 核心修改 2：下层释义卡片向下延伸 */
.immersive-lower { 
    flex: 5.5; 
    padding: 0 16px 35px 16px; 
    position: relative;        
    margin-bottom: 0; 
}

.def-panel {
    background: rgba(35, 40, 50, 0.95); 
    border-radius: 20px; 
    padding: 28px 24px; 
    height: 100%; 
    position: relative; 
    box-shadow: 0 -8px 30px rgba(0,0,0,0.3);
    margin: 0 6px; 
    border: 1px solid rgba(255,255,255,0.03); 
}

.im-pos { font-size: 0.85rem; color: #2ecc71; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px; }
.im-en-def { font-size: 1.15rem; margin-bottom: 10px; line-height: 1.45; font-weight: 500;}
.im-zh-def { font-size: 0.98rem; color: rgba(255,255,255,0.5); line-height: 1.5;}

.meaning-counter { position: absolute; bottom: 22px; right: 24px; font-size: 0.85rem; color: rgba(255,255,255,0.3); font-weight: 600; }

/* 压缩底部操作栏，把空间让给释义卡片 */
.immersive-footer { 
    height: 60px; 
    display: flex; justify-content: space-between; align-items: center; 
    padding: 0 24px; background: rgba(20, 25, 30, 0.98); position: relative; 
}

.im-footer-btn { 
    font-size: 0.92rem; color: rgba(255,255,255,0.85); cursor: pointer; 
    display: flex; align-items: center; gap: 7px; font-weight: 500; transition: opacity 0.2s;
}
.im-footer-btn:active { opacity: 0.6; }

.im-btn-next-word { color: #f39c12; } 
.im-btn-close { color: rgba(255,255,255,0.6); }

.global-pagination { 
    position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; 
}
.global-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1); }
.global-dot.capsule { width: auto; height: auto; background: #fff; color: #000; font-size: 0.7rem; font-weight: 600; padding: 2px 10px; border-radius: 10px; }


/* ================= 全新：拼写测试与小结视图样式 ================= */

.spell-top-bar { padding: 20px 24px; text-align: right; color: rgba(255,255,255,0.5); font-size: 0.95rem; font-weight: 500; }

.spell-main { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0 20px; }
.meaning-area { margin-bottom: 60px; text-align: center; }
#spell-word-meaning { font-size: 1.4rem; color: #e0e0e0; line-height: 1.5; }

/* 输入区核心布局 */
.input-container { position: relative; width: 100%; display: flex; justify-content: center; margin-bottom: 30px; }
.letter-boxes { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; z-index: 2; pointer-events: none; }
.letter-box { width: 32px; height: 40px; border-bottom: 2px solid rgba(255,255,255,0.3); display: flex; justify-content: center; align-items: flex-end; padding-bottom: 5px; font-size: 1.5rem; font-weight: 600; text-transform: lowercase; transition: all 0.2s; }

/* 隐藏真实 Input，但盖在盒子上层以接收焦点和触摸 */
#hidden-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; z-index: 3; font-size: 16px; }

.submit-hint { font-size: 0.8rem; color: rgba(255,255,255,0.3); text-align: center; margin-top: 20px; }

/* 状态反馈样式 */
.letter-box.filled { border-bottom-color: #fff; }
.letter-box.correct { border-bottom-color: #2ecc71; color: #2ecc71; }
.letter-box.wrong { border-bottom-color: #e74c3c; color: #e74c3c; }
.letter-box.correction { border-bottom-color: #2ecc71; color: #2ecc71; font-style: italic; opacity: 0.8; } 

/* 底部提示灯泡 */
.hint-footer { padding: 30px; display: flex; justify-content: center; align-items: center; height: 100px; }
.hint-container { display: flex; justify-content: center; align-items: center; cursor: pointer; height: 40px; }
.bulb-icon { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: rgba(255,255,255,0.6); transition: all 0.2s; }
.bulb-icon:active { background: rgba(255,255,255,0.1); }
.phonetic-text { font-size: 1.2rem; color: #f39c12; font-family: monospace; letter-spacing: 1px; animation: fadeIn 0.3s; }

/* 学习小结视图 */
.summary-header { padding: 50px 20px 20px; text-align: center; }
.summary-header h2 { font-size: 1.8rem; margin-bottom: 10px; }
.summary-header p { color: rgba(255,255,255,0.6); font-size: 0.9rem; }

.summary-list { flex: 1; overflow-y: auto; padding: 0 20px 100px; }
.summary-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 12px; margin-bottom: 10px; }
.summary-word { font-size: 1.2rem; font-weight: 600; }
.summary-error { font-size: 0.9rem; padding: 4px 10px; border-radius: 12px; background: rgba(231, 76, 60, 0.2); color: #ff6b6b; }
.summary-error.zero { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }

.summary-footer { position: absolute; bottom: 0; left: 0; width: 100%; padding: 20px; background: linear-gradient(transparent, #121212 30%); }
.primary-btn { width: 100%; padding: 16px; border-radius: 12px; border: none; background: #2ecc71; color: #121212; font-size: 1.1rem; font-weight: 600; cursor: pointer; }
.primary-btn:active { opacity: 0.8; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
