/* ========== 课件配置 ========== */
const slideFiles = [
    'slides/S001-cover.html',
    'slides/S002-overview.html',
    'slides/S003-ch1-title.html',
    'slides/S004-llm-limits.html',
    'slides/S005-hallucination.html',
    'slides/S006-three-solutions.html',
    'slides/S011-product-value.html',
    'slides/S007-rag-core-idea.html',
    'slides/S040-broad-vs-narrow.html',
    'slides/S008-rag-3steps.html',
    'slides/S009-tech-stack.html',
    'slides/S010-use-cases.html',
    'slides/S012-ch1-summary.html',
    'slides/S013-ch2-title.html',
    'slides/S014-data-flow.html',
    'slides/S015-six-components.html',
    'slides/S016-doc-loader.html',
    'slides/S017-text-splitter.html',
    'slides/S018-embedding.html',
    'slides/S019-vector-store.html',
    'slides/S020-retriever.html',
    'slides/S021-llm-generate.html',
    'slides/S022-rag-gen1.html',
    'slides/S023-rag-gen2.html',
    'slides/S024-rag-gen3.html',
    'slides/S045-rag-gen4.html',
    'slides/S025-frameworks.html',
    'slides/S026-opensource.html',
    'slides/S041-ch2-summary.html',
    'slides/S027-ch3-title.html',
    'slides/S028-embedding-principle.html',
    'slides/S030-cosine-similarity.html',
    'slides/S029-embedding-models.html',
    'slides/S042-phase-offline.html',
    'slides/S031-doc-loader-flow.html',
    'slides/S032-text-split-strategy.html',
    'slides/S033-faiss-index.html',
    'slides/S043-phase-online.html',
    'slides/S034-topk-retrieval.html',
    'slides/S035-prompt-design.html',
    'slides/S044-token-budget.html',
    'slides/S036-full-pipeline.html',
    'slides/S037-rag-simulator.html',
    'slides/S038-achievements.html',
    'slides/S039-next-steps.html',
];

const slideTitles = [
    '封面：RAG 检索增强生成',
    '课程全局导航',
    '第一章：知识困境与检索增强',
    '大模型三大知识局限',
    '幻觉问题：闭卷考试的代价',
    '三种知识注入方案对比',
    '知识更新方式成本对比',
    'RAG 核心思想：开卷考试',
    '广义 RAG vs 狭义 RAG',
    'RAG 三步骤：检索→增强→生成',
    'RAG 在 LLM 技术栈中的位置',
    '四大核心应用场景',
    '第一章小结',
    '第二章：RAG 核心架构',
    '离线索引 + 在线查询双流水线',
    '六大核心组件功能对照',
    'Document Loader：统一数据入口',
    'Text Splitter：切分参数演示',
    'Embedding：向量语义空间',
    'Vector Store：四种向量数据库',
    'Retriever：向量检索 vs 混合检索',
    'LLM 生成：Prompt 构造',
    '第一代 Naive RAG',
    '第二代 Advanced RAG',
    '第三代 Modular RAG',
    '第四代 Agentic RAG',
    'LangChain vs LlamaIndex 框架选型',
    'MaxKB / RAGFlow / Chatchat 开源项目',
    '第二章小结：从认知到架构',
    '第三章：手动搭建 RAG 概念',
    'Embedding 原理：文字→向量坐标',
    '余弦相似度直觉演示',
    '主流 Embedding 模型对比',
    '📦 离线索引阶段',
    'Document Loader 流程',
    '文本切分策略：递归分隔符 + overlap',
    'FAISS 索引：归一化 + 内积检索',
    '🔍 在线查询阶段',
    'Top-K 检索流程',
    'RAG Prompt 设计：引用而非创作',
    'Token 预算控制与上下文拼接',
    '完整 Pipeline 端到端串联',
    '🎮 RAG 全流程交互模拟器',
    '学习收获清单',
    '下一步：ipynb 实战课件预告',
];

/* ========== 状态管理 ========== */
let currentSlide = 1;
let loadedSlides = {};
const totalSlides = slideFiles.length;

/* ========== Slide 加载与显示 ========== */
async function loadSlide(n) {
    if (n < 1 || n > totalSlides) return '';
    const file = slideFiles[n - 1];
    if (loadedSlides[file]) return loadedSlides[file];
    try {
        const resp = await fetch(file + '?t=' + Date.now());
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const html = await resp.text();
        loadedSlides[file] = html;
        return html;
    } catch (e) {
        console.error('加载失败:', file, e);
        return '<div class="slide" style="justify-content:center;align-items:center;">' +
               '<h2 style="color:#ef4444;">页面加载失败</h2>' +
               '<p style="color:#94a3b8;">' + file + '</p></div>';
    }
}

async function showSlide(n) {
    if (n < 1 || n > totalSlides) return;
    currentSlide = n;

    const container = document.getElementById('slide-container');
    const html = await loadSlide(n);
    container.innerHTML = html;

    const slideEl = container.querySelector('.slide');
    if (slideEl) {
        slideEl.classList.add('active');
        setTimeout(() => triggerAnimations(slideEl), 50);
    }

    if (window.slideHooks) {
        const filename = slideFiles[n - 1].split('/').pop();
        const hook = window.slideHooks[filename] || window.slideHooks[n];
        if (hook) setTimeout(() => hook(), 100);
    }

    updateUI();
    preloadAdjacent(n);
    localStorage.setItem('currentSlide', n);
}

function triggerAnimations(slideEl) {
    const elements = slideEl.querySelectorAll('.animate-ready');
    elements.forEach((el, i) => {
        setTimeout(() => el.classList.add('animate-in'), i * 100);
    });
}

/* ========== 导航 ========== */
function nextSlide() { if (currentSlide < totalSlides) showSlide(currentSlide + 1); }
function prevSlide() { if (currentSlide > 1) showSlide(currentSlide - 1); }
function goToSlide(n) { showSlide(n); closeMenu(); }

/* ========== 预加载 ========== */
function preloadAdjacent(n) {
    if (n + 1 <= totalSlides) loadSlide(n + 1);
    if (n - 1 >= 1) loadSlide(n - 1);
}

/* ========== UI 更新 ========== */
function updateUI() {
    const pct = (currentSlide / totalSlides) * 100;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('pageIndicator').textContent = currentSlide + ' / ' + totalSlides;
    document.querySelectorAll('.menu-item').forEach((item, i) => {
        item.classList.toggle('active', i + 1 === currentSlide);
    });
}

/* ========== 菜单 ========== */
function buildMenu() {
    const container = document.getElementById('menuItems');
    container.innerHTML = slideTitles.map((title, i) =>
        '<div class="menu-item" onclick="goToSlide(' + (i+1) + ')">' +
        '<span class="menu-num">' + String(i+1).padStart(2,'0') + '</span>' +
        '<span class="menu-text">' + title + '</span></div>'
    ).join('');
}
function openMenu() {
    document.getElementById('sidebarMenu').classList.add('open');
    document.getElementById('menuOverlay').classList.add('open');
}
function closeMenu() {
    document.getElementById('sidebarMenu').classList.remove('open');
    document.getElementById('menuOverlay').classList.remove('open');
}
function toggleMenu() {
    document.getElementById('sidebarMenu').classList.contains('open') ? closeMenu() : openMenu();
}

/* ========== 全屏 ========== */
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        (document.documentElement.requestFullscreen ||
         document.documentElement.webkitRequestFullscreen ||
         document.documentElement.msRequestFullscreen).call(document.documentElement);
    } else {
        (document.exitFullscreen ||
         document.webkitExitFullscreen ||
         document.msExitFullscreen).call(document);
    }
}

/* ========== 钢笔拖尾 ========== */
let isPenTrailOn = false;
let penPoints = [];
const PEN_TRAIL_LENGTH = 20;
let penCanvas, penCtx;

function initPenTrail() {
    penCanvas = document.getElementById('pen-trail-canvas');
    penCtx = penCanvas.getContext('2d');
    resizePenCanvas();
    window.addEventListener('resize', resizePenCanvas);
    document.addEventListener('mousemove', trackPenPoint);
}

function resizePenCanvas() {
    if (!penCanvas) return;
    penCanvas.width = window.innerWidth;
    penCanvas.height = window.innerHeight;
}

function trackPenPoint(e) {
    if (isPenTrailOn) {
        penPoints.push({ x: e.clientX, y: e.clientY, age: 0 });
    }
}

function togglePenTrail() {
    isPenTrailOn = !isPenTrailOn;
    penCanvas.classList.toggle('active', isPenTrailOn);
    if (isPenTrailOn) {
        penPoints = [];
        animatePenTrail();
    }
}

function animatePenTrail() {
    if (!isPenTrailOn) return;
    penCtx.clearRect(0, 0, penCanvas.width, penCanvas.height);

    for (let i = 0; i < penPoints.length; i++) {
        penPoints[i].age++;
    }
    penPoints = penPoints.filter(p => p.age < PEN_TRAIL_LENGTH);

    if (penPoints.length >= 2) {
        for (let i = 1; i < penPoints.length; i++) {
            const p1 = penPoints[i - 1];
            const p2 = penPoints[i];
            const opacity = i / penPoints.length;

            penCtx.beginPath();
            penCtx.moveTo(p1.x, p1.y);
            penCtx.lineTo(p2.x, p2.y);
            penCtx.lineWidth = 4 * opacity;
            penCtx.lineCap = 'round';
            penCtx.lineJoin = 'round';
            penCtx.strokeStyle = `rgba(124, 58, 237, ${opacity})`;
            penCtx.stroke();
        }
    }
    requestAnimationFrame(animatePenTrail);
}

/* ========== 键盘控制 ========== */
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowRight': case ' ': case 'Enter': case 'PageDown':
            e.preventDefault(); nextSlide(); break;
        case 'ArrowLeft': case 'PageUp':
            e.preventDefault(); prevSlide(); break;
        case 'f': case 'F': toggleFullScreen(); break;
        case 'm': case 'M': toggleMenu(); break;
        case 't': case 'T': togglePenTrail(); break;
        case 'Escape': closeMenu(); break;
    }
});

/* ========== 星空生成 ========== */
function generateStars() {
    const bg = document.getElementById('starsBg');
    if (!bg) return;
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (2 + Math.random() * 2) + 's';
        bg.appendChild(star);
    }
}

/* ========== 初始化 ========== */
window.addEventListener('DOMContentLoaded', () => {
    generateStars();
    buildMenu();
    initPenTrail();
    const saved = parseInt(localStorage.getItem('currentSlide')) || 1;
    showSlide(saved);
});
