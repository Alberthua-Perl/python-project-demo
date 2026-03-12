/* ========== RAG 入门课件交互逻辑 ========== */

window.slideHooks = window.slideHooks || {};

/* ── S007: RAG 核心思想步进动画 ── */
window.slideHooks['S007-rag-core-idea.html'] = function() {
    var steps = document.querySelectorAll('.rag-step');
    var btn = document.getElementById('rag-step-btn');
    var current = 0;
    steps.forEach(function(s) {
        s.style.opacity = '0.2';
        s.style.transform = 'translateY(10px)';
        s.style.transition = 'all 0.5s ease';
    });
    if (btn) {
        btn.disabled = false;
        btn.textContent = '▶ 开始演示';
        btn.onclick = function() {
            if (current < steps.length) {
                steps[current].style.opacity = '1';
                steps[current].style.transform = 'translateY(0)';
                current++;
                if (current >= steps.length) {
                    btn.textContent = '✓ 演示完成';
                    btn.disabled = true;
                } else {
                    btn.textContent = '▶ 下一步 (' + current + '/' + steps.length + ')';
                }
            }
        };
    }
};

/* ── S014: 双流水线动画 ── */
window.slideHooks['S014-data-flow.html'] = function() {
    var offlineSteps = document.querySelectorAll('.offline-step');
    var onlineSteps = document.querySelectorAll('.online-step');
    var btn = document.getElementById('flow-btn');
    var allSteps = Array.from(offlineSteps).concat(Array.from(onlineSteps));
    allSteps.forEach(function(s) {
        s.style.opacity = '0.15';
        s.style.borderColor = 'rgba(139,92,246,0.15)';
        s.style.transition = 'all 0.4s ease';
    });
    var phase = 0;
    if (btn) {
        btn.disabled = false;
        btn.textContent = '▶ 演示离线索引流';
        btn.onclick = function() {
            if (phase === 0) {
                offlineSteps.forEach(function(s, i) {
                    setTimeout(function() {
                        s.style.opacity = '1';
                        s.style.borderColor = 'rgba(59,130,246,0.6)';
                    }, i * 300);
                });
                btn.textContent = '▶ 演示在线查询流';
                phase = 1;
            } else if (phase === 1) {
                onlineSteps.forEach(function(s, i) {
                    setTimeout(function() {
                        s.style.opacity = '1';
                        s.style.borderColor = 'rgba(139,92,246,0.6)';
                    }, i * 300);
                });
                btn.textContent = '↺ 重置';
                phase = 2;
            } else {
                allSteps.forEach(function(s) {
                    s.style.opacity = '0.15';
                    s.style.borderColor = 'rgba(139,92,246,0.15)';
                });
                btn.textContent = '▶ 演示离线索引流';
                phase = 0;
            }
        };
    }
};

/* ── S017: Text Splitter 文本切分可视化 ── */
window.slideHooks['S017-text-splitter.html'] = function() {
    var slider = document.getElementById('chunk-slider');
    var display = document.getElementById('chunk-display');
    var countEl = document.getElementById('chunk-count');
    var overlapEl = document.getElementById('overlap-display');
    var textDisplay = document.getElementById('chunk-text-display');
    var legendEl = document.getElementById('chunk-legend');
    if (!slider || !display || !textDisplay) return;

    var SAMPLE = '员工入职满一年后享有5天带薪年假，满三年增至10天，满五年增至15天。年假须提前三个工作日申请，经直属主管审批后生效。未休年假可在次年第一季度内补休，逾期作废。病假期间不计入年假。特殊岗位（如客服、运维）需在部门排班表确认后方可休假。年假期间薪资照常发放，绩效考核不受影响。离职时未休年假按日薪折算补偿。实习期员工不享有年假。兼职员工按实际工作天数折算年假天数。';
    var COLORS = ['#3b82f6','#8b5cf6','#0891b2','#f59e0b','#ef4444','#ec4899','#22c55e','#6366f1'];
    var SIM_LEN = 2000;
    var textLen = SAMPLE.length;

    function update() {
        var size = parseInt(slider.value);
        var overlap = Math.round(size * 0.2);
        var step = Math.max(1, size - overlap);
        var count = Math.ceil(SIM_LEN / step);
        display.textContent = size;
        if (countEl) countEl.textContent = count;
        if (overlapEl) overlapEl.textContent = overlap;

        // Scale to display text
        var dSize = Math.max(10, Math.round(textLen * size / SIM_LEN));
        var dOverlap = Math.round(dSize * 0.2);
        var dStep = Math.max(1, dSize - dOverlap);

        // Chunk boundaries
        var chunks = [];
        var pos = 0;
        while (pos < textLen) {
            var end = Math.min(pos + dSize, textLen);
            chunks.push({ s: pos, e: end });
            pos += dStep;
            if (end >= textLen) break;
        }

        // Membership: which chunk(s) each char belongs to
        var mem = [];
        for (var i = 0; i < textLen; i++) {
            var m = [];
            for (var c = 0; c < chunks.length; c++) {
                if (i >= chunks[c].s && i < chunks[c].e) m.push(c);
            }
            mem.push(m);
        }

        // Group consecutive chars with same membership
        var segs = [];
        var segS = 0;
        var curKey = mem[0].join('-');
        for (var i = 1; i <= textLen; i++) {
            var key = i < textLen ? mem[i].join('-') : '';
            if (key !== curKey) {
                segs.push({ s: segS, e: i, m: mem[segS].slice() });
                segS = i;
                curKey = key;
            }
        }

        // Render segments
        var html = '';
        segs.forEach(function(seg) {
            var t = SAMPLE.substring(seg.s, seg.e);
            if (seg.m.length >= 2) {
                var c1 = COLORS[seg.m[0] % COLORS.length];
                var c2 = COLORS[seg.m[1] % COLORS.length];
                html += '<span title="Overlap: Chunk' + (seg.m[0]+1) + ' ∩ Chunk' + (seg.m[1]+1) + '" style="background:repeating-linear-gradient(135deg,' + c1 + '30,' + c1 + '30 2px,' + c2 + '30 2px,' + c2 + '30 4px);border-bottom:2px solid ' + c2 + ';border-radius:2px;padding:1px 0;cursor:help;">' + t + '</span>';
            } else if (seg.m.length === 1) {
                var color = COLORS[seg.m[0] % COLORS.length];
                html += '<span title="Chunk ' + (seg.m[0]+1) + '" style="background:' + color + '22;border-radius:2px;padding:1px 0;">' + t + '</span>';
            }
        });
        textDisplay.innerHTML = html;

        // Legend
        if (legendEl) {
            var lh = '';
            var n = Math.min(chunks.length, COLORS.length);
            for (var i = 0; i < n; i++) {
                var cl = COLORS[i % COLORS.length];
                lh += '<span style="display:inline-flex;align-items:center;gap:3px;"><span style="width:10px;height:10px;background:' + cl + '35;border-radius:2px;border:1px solid ' + cl + ';"></span>Chunk ' + (i+1) + '</span>';
            }
            if (chunks.length > COLORS.length) lh += '<span>... +' + (chunks.length - COLORS.length) + '</span>';
            legendEl.innerHTML = lh;
        }
    }
    slider.oninput = update;
    update();
};

/* ── S018: Embedding 向量语义空间 ── */
window.slideHooks['S018-embedding.html'] = function() {
    var pairs = document.querySelectorAll('.sem-pair');
    pairs.forEach(function(p) {
        p.style.opacity = '1';
        p.style.cursor = 'pointer';
        p.onclick = function() {
            var dot = p.querySelector('.sem-dot');
            var score = p.getAttribute('data-score');
            var info = p.querySelector('.sem-info');
            if (dot) {
                dot.style.transform = 'scale(1.4)';
                setTimeout(function() { dot.style.transform = 'scale(1)'; }, 400);
            }
            if (info && score) {
                info.style.opacity = '1';
                info.textContent = '相似度: ' + score;
            }
        };
    });
};

/* ── S028: Embedding 原理动画 ── */
window.slideHooks['S028-embedding-principle.html'] = function() {
    var btn = document.getElementById('embed-btn');
    var words = document.querySelectorAll('.word-token');
    var arrows = document.querySelectorAll('.embed-arrow');
    var vectors = document.querySelectorAll('.vector-result');
    var phase = 0;
    if (!btn) return;
    words.forEach(function(w) { w.style.opacity = '1'; });
    arrows.forEach(function(a) { a.style.opacity = '0'; a.style.transition = 'opacity 0.4s'; });
    vectors.forEach(function(v) { v.style.opacity = '0'; v.style.transition = 'opacity 0.4s'; });
    btn.onclick = function() {
        if (phase === 0) {
            arrows.forEach(function(a) { a.style.opacity = '1'; });
            btn.textContent = '▶ 查看向量结果';
            phase = 1;
        } else if (phase === 1) {
            vectors.forEach(function(v) { v.style.opacity = '1'; });
            btn.textContent = '↺ 重置';
            phase = 2;
        } else {
            arrows.forEach(function(a) { a.style.opacity = '0'; });
            vectors.forEach(function(v) { v.style.opacity = '0'; });
            btn.textContent = '▶ 开始向量化';
            phase = 0;
        }
    };
    btn.textContent = '▶ 开始向量化';
};

/* ── S030: 余弦相似度直觉演示 ── */
window.slideHooks['S030-cosine-similarity.html'] = function() {
    var canvas = document.getElementById('cosine-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var pairs = document.querySelectorAll('.cosine-pair');
    function drawVectors(angle1, angle2, color1, color2, score) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var cx = canvas.width / 2, cy = canvas.height / 2;
        var len = 90;
        ctx.lineWidth = 3;
        ctx.strokeStyle = color1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + len * Math.cos(angle1), cy - len * Math.sin(angle1));
        ctx.stroke();
        ctx.strokeStyle = color2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + len * Math.cos(angle2), cy - len * Math.sin(angle2));
        ctx.stroke();
        ctx.fillStyle = 'rgba(139,92,246,0.15)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 40, -angle1, -angle2, angle1 > angle2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Monaco';
        ctx.textAlign = 'center';
        ctx.fillText('cos θ = ' + score, cx, cy + 120);
    }
    drawVectors(0.3, 0.5, '#3b82f6', '#8b5cf6', '0.92');
    pairs.forEach(function(p) {
        p.style.cursor = 'pointer';
        p.onclick = function() {
            pairs.forEach(function(x) { x.classList.remove('active'); });
            p.classList.add('active');
            var a1 = parseFloat(p.getAttribute('data-a1'));
            var a2 = parseFloat(p.getAttribute('data-a2'));
            var score = p.getAttribute('data-score');
            var c1 = p.getAttribute('data-c1') || '#3b82f6';
            var c2 = p.getAttribute('data-c2') || '#8b5cf6';
            drawVectors(a1, a2, c1, c2, score);
        };
    });
};

/* ── S036: 完整 Pipeline 端到端串联 ── */
window.slideHooks['S036-full-pipeline.html'] = function() {
    var steps = document.querySelectorAll('.pipeline-step');
    var btn = document.getElementById('pipeline-btn');
    var current = 0;
    steps.forEach(function(s) {
        s.style.opacity = '0.15';
        s.style.borderColor = 'rgba(139,92,246,0.15)';
        s.style.transition = 'all 0.4s ease';
    });
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = '▶ 开始演示 Pipeline';
    btn.onclick = function() {
        if (current < steps.length) {
            steps[current].style.opacity = '1';
            steps[current].style.borderColor = 'rgba(59,130,246,0.7)';
            steps[current].style.boxShadow = '0 0 20px rgba(59,130,246,0.3)';
            current++;
            if (current >= steps.length) {
                btn.textContent = '✓ Pipeline 完成！↺ 重置';
            } else {
                btn.textContent = '▶ 下一步：' + steps[current].getAttribute('data-label');
            }
        } else {
            steps.forEach(function(s) {
                s.style.opacity = '0.15';
                s.style.borderColor = 'rgba(139,92,246,0.15)';
                s.style.boxShadow = 'none';
            });
            current = 0;
            btn.textContent = '▶ 开始演示 Pipeline';
        }
    };
    if (steps.length > 0 && steps[0].getAttribute('data-label')) {
        btn.textContent = '▶ 下一步：' + steps[0].getAttribute('data-label');
    }
};

/* ── S037: RAG 全流程交互模拟器 ── */
window.slideHooks['S037-rag-simulator.html'] = function() {
    var btn = document.getElementById('sim-btn');
    var desc = document.getElementById('sim-desc');
    if (!btn || !desc) return;

    var stage = 0;
    var CHUNK_COLORS = ['#3b82f6','#8b5cf6','#0891b2','#f59e0b','#ef4444'];
    var DOC_TEXT = '员工入职满一年后享有5天带薪年假，满三年增至10天，满五年增至15天。年假须提前三个工作日申请，经直属主管审批后生效。未休年假可在次年第一季度内补休，逾期作废。病假期间不计入年假。特殊岗位（如客服、运维）需在部门排班表确认后方可休假。年假期间薪资照常发放，绩效考核不受影响。离职时未休年假按日薪折算补偿。';
    var CHUNKS = [
        '员工入职满一年后享有5天带薪年假，满三年增至10天，满五年增至15天。',
        '满三年增至10天，满五年增至15天。年假须提前三个工作日申请，经直属主管审批后生效。',
        '未休年假可在次年第一季度内补休，逾期作废。病假期间不计入年假。',
        '特殊岗位（如客服、运维）需在部门排班表确认后方可休假。年假期间薪资照常发放，绩效考核不受影响。',
        '年假期间薪资照常发放，绩效考核不受影响。离职时未休年假按日薪折算补偿。'
    ];
    var VECTORS = [
        [0.42, -0.18, 0.76, 0.33, -0.51],
        [0.38, -0.12, 0.81, 0.27, -0.44],
        [-0.15, 0.63, 0.22, -0.41, 0.55],
        [0.11, 0.47, -0.33, 0.68, 0.19],
        [0.29, 0.51, -0.08, 0.44, -0.22]
    ];
    var QUERY = '公司工作满三年有多少天年假？';
    var QUERY_VEC = [0.36, -0.10, 0.79, 0.30, -0.48];
    var TOPK = [
        { idx: 1, score: 0.96 },
        { idx: 0, score: 0.91 },
        { idx: 4, score: 0.72 }
    ];
    var ANSWER = '根据公司年假管理制度，<span class="sim-highlight">员工入职满三年后享有 10 天带薪年假</span>。年假须提前三个工作日申请，经直属主管审批后生效。<span class="sim-highlight">未休年假可在次年第一季度内补休，逾期作废</span>。离职时未休年假按日薪折算补偿。';

    // 散点图坐标（模拟 2D 投影）
    var SCATTER_POS = [
        { x: 180, y: 80 },
        { x: 210, y: 110 },
        { x: 320, y: 200 },
        { x: 100, y: 220 },
        { x: 260, y: 170 }
    ];
    var QUERY_POS = { x: 200, y: 95 };

    // __SIM_HELPERS__

    function updatePipeline(activeIdx) {
        for (var i = 0; i <= 8; i++) {
            var node = document.getElementById('sim-node-' + i);
            if (!node) continue;
            node.classList.remove('active','active-online','done','done-online');
            if (i < activeIdx) {
                node.classList.add(i <= 3 ? 'done' : 'done-online');
            } else if (i === activeIdx) {
                node.classList.add(i <= 3 ? 'active' : 'active-online');
            }
        }
        // Light up edges
        var offEdges = document.querySelectorAll('.sim-edge-offline');
        var onEdges = document.querySelectorAll('.sim-edge-online');
        offEdges.forEach(function(e, i) {
            e.classList.remove('lit');
            if (i < activeIdx && activeIdx <= 4) e.classList.add('lit');
            if (activeIdx > 3) e.classList.add('lit');
        });
        onEdges.forEach(function(e, i) {
            e.classList.remove('lit-online');
            if (activeIdx > 4 && i < (activeIdx - 4)) e.classList.add('lit-online');
        });
        // Phase labels
        var lblOff = document.getElementById('sim-label-offline');
        var lblOn = document.getElementById('sim-label-online');
        if (lblOff) lblOff.style.opacity = activeIdx <= 3 ? '1' : '0.4';
        if (lblOn) lblOn.style.opacity = activeIdx >= 4 ? '1' : '0.4';
    }

    function showScene(idx) {
        for (var i = 0; i <= 8; i++) {
            var s = document.getElementById('sim-s' + i);
            if (s) s.style.display = (i === idx) ? 'flex' : 'none';
        }
    }

    function drawScatter(canvasId, points, colors, queryPt, topkIdxs, radarProgress) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(37,99,235,0.08)';
        ctx.lineWidth = 1;
        for (var gx = 40; gx < w; gx += 40) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
        }
        for (var gy = 40; gy < h; gy += 40) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
        }

        // Radar sweep
        if (queryPt && radarProgress > 0) {
            var maxR = 180;
            var r = maxR * radarProgress;
            ctx.beginPath();
            ctx.arc(queryPt.x, queryPt.y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(124,58,237,0.06)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(124,58,237,0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Top-K lines
        if (queryPt && topkIdxs && topkIdxs.length > 0) {
            topkIdxs.forEach(function(tk) {
                var p = points[tk.idx];
                ctx.beginPath();
                ctx.moveTo(queryPt.x, queryPt.y);
                ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = 'rgba(124,58,237,0.35)';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                // Score label
                var mx = (queryPt.x + p.x) / 2;
                var my = (queryPt.y + p.y) / 2;
                ctx.fillStyle = '#7c3aed';
                ctx.font = 'bold 11px Monaco, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(tk.score.toFixed(2), mx + 12, my - 6);
            });
        }

        // Chunk dots
        points.forEach(function(p, i) {
            var isTopK = topkIdxs && topkIdxs.some(function(tk) { return tk.idx === i; });
            var radius = isTopK ? 10 : 7;
            var alpha = (topkIdxs && topkIdxs.length > 0 && !isTopK) ? 0.3 : 1;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = colors[i];
            ctx.fill();
            if (isTopK) {
                ctx.strokeStyle = colors[i];
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
                ctx.globalAlpha = 0.3;
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            // Label
            ctx.fillStyle = '#475569';
            ctx.font = '11px PingFang SC, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('C' + (i + 1), p.x, p.y - 14);
        });

        // Query point
        if (queryPt) {
            ctx.beginPath();
            ctx.moveTo(queryPt.x, queryPt.y - 10);
            ctx.lineTo(queryPt.x + 9, queryPt.y + 7);
            ctx.lineTo(queryPt.x - 9, queryPt.y + 7);
            ctx.closePath();
            ctx.fillStyle = '#7c3aed';
            ctx.fill();
            ctx.fillStyle = '#7c3aed';
            ctx.font = 'bold 11px PingFang SC, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Query', queryPt.x, queryPt.y - 16);
        }
    }

    // __SIM_STAGES__

    /* Stage 0 → 1: 文本切分 */
    function doStage1() {
        showScene(1);
        updatePipeline(1);
        var container = document.getElementById('sim-chunks-container');
        if (!container) return;
        container.innerHTML = '';
        CHUNKS.forEach(function(text, i) {
            var card = document.createElement('div');
            card.className = 'sim-chunk';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px) rotate(' + (Math.random() * 4 - 2) + 'deg)';
            card.style.borderColor = CHUNK_COLORS[i];
            var label = document.createElement('div');
            label.className = 'sim-chunk-label';
            label.style.background = CHUNK_COLORS[i];
            label.textContent = 'Chunk ' + (i + 1);
            card.appendChild(label);
            var txt = document.createElement('div');
            txt.textContent = text;
            txt.style.marginTop = '8px';
            card.appendChild(txt);
            container.appendChild(card);
            setTimeout(function() {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) rotate(0deg)';
            }, i * 200 + 100);
        });
        // Overlap indicators
        setTimeout(function() {
            var cards = container.querySelectorAll('.sim-chunk');
            cards.forEach(function(c, i) {
                if (i < cards.length - 1) {
                    var ov = document.createElement('div');
                    ov.style.cssText = 'position:absolute;bottom:4px;right:4px;font-size:0.65em;color:var(--accent);opacity:0.7;';
                    ov.textContent = '↔ overlap';
                    c.appendChild(ov);
                }
            });
        }, CHUNKS.length * 200 + 300);
        desc.textContent = '文档被切成 ' + CHUNKS.length + ' 个有重叠的片段，每个片段足够小，能被 Embedding 模型处理。';
        btn.textContent = '🔢 向量化';
    }

    /* Stage 1 → 2: Embedding */
    function doStage2() {
        showScene(2);
        updatePipeline(2);
        var container = document.getElementById('sim-embed-container');
        if (!container) return;
        container.innerHTML = '';
        CHUNKS.forEach(function(text, i) {
            var flipCard = document.createElement('div');
            flipCard.className = 'sim-flip-card';
            flipCard.style.width = '190px';
            flipCard.style.height = '140px';
            var inner = document.createElement('div');
            inner.className = 'sim-flip-inner';
            inner.id = 'sim-flip-' + i;
            // Front
            var front = document.createElement('div');
            front.className = 'sim-flip-front';
            front.style.borderColor = CHUNK_COLORS[i];
            front.innerHTML = '<div style="font-size:0.7em;color:' + CHUNK_COLORS[i] + ';font-weight:700;margin-bottom:4px;">Chunk ' + (i+1) + '</div>' +
                '<div style="font-size:0.72em;line-height:1.5;color:var(--text-secondary);">' + text.substring(0, 40) + '...</div>';
            // Back
            var back = document.createElement('div');
            back.className = 'sim-flip-back';
            var vecStr = '[' + VECTORS[i].map(function(v) { return v.toFixed(2); }).join(', ') + ', ...]';
            back.innerHTML = '<div style="font-size:0.7em;color:var(--accent);font-weight:700;margin-bottom:4px;">🔢 Vector ' + (i+1) + '</div>' +
                '<div style="font-size:0.68em;font-family:Monaco,monospace;word-break:break-all;color:var(--text-secondary);">' + vecStr + '</div>';
            inner.appendChild(front);
            inner.appendChild(back);
            flipCard.appendChild(inner);
            container.appendChild(flipCard);
            // Staggered flip
            setTimeout(function() {
                inner.classList.add('flipped');
            }, i * 300 + 500);
        });
        desc.textContent = 'Embedding 模型将每个文本片段压缩为高维向量，语义相近的文本，向量也相近。';
        btn.textContent = '🗄️ 存入向量库';
    }

    /* Stage 2 → 3: 存入向量库 */
    function doStage3() {
        showScene(3);
        updatePipeline(3);
        // Draw scatter plot with chunks flying in
        var drawnCount = 0;
        function drawNext() {
            if (drawnCount > CHUNKS.length) return;
            drawScatter('sim-scatter', SCATTER_POS.slice(0, drawnCount), CHUNK_COLORS.slice(0, drawnCount), null, null, 0);
            drawnCount++;
            if (drawnCount <= CHUNKS.length) setTimeout(drawNext, 350);
        }
        drawNext();
        // DB panel
        var dbPanel = document.getElementById('sim-db-panel');
        if (dbPanel) {
            dbPanel.innerHTML = '<div style="font-weight:700;font-size:0.85em;color:var(--primary);margin-bottom:4px;">🗄️ 向量数据库</div>';
            CHUNKS.forEach(function(_, i) {
                var row = document.createElement('div');
                row.style.cssText = 'font-size:0.75em;padding:6px 10px;background:var(--card-bg);border:1px solid ' + CHUNK_COLORS[i] + '30;border-radius:8px;color:var(--text-secondary);opacity:0;transition:opacity 0.4s;';
                row.innerHTML = '<span style="color:' + CHUNK_COLORS[i] + ';font-weight:700;">C' + (i+1) + '</span> → [' + VECTORS[i].slice(0,3).map(function(v){return v.toFixed(2);}).join(', ') + '...]';
                dbPanel.appendChild(row);
                setTimeout(function() { row.style.opacity = '1'; }, i * 350 + 200);
            });
            setTimeout(function() {
                var banner = document.createElement('div');
                banner.className = 'sim-complete-banner';
                banner.textContent = '✅ 离线索引完成 — 知识已准备就绪';
                banner.style.opacity = '0';
                banner.style.transition = 'opacity 0.5s';
                dbPanel.appendChild(banner);
                setTimeout(function() { banner.style.opacity = '1'; }, 100);
            }, CHUNKS.length * 350 + 500);
        }
        desc.textContent = '所有文档片段已转化为向量并存入数据库。离线处理阶段结束，接下来进入在线问答。';
        btn.textContent = '❓ 开始提问';
        btn.style.borderColor = 'rgba(124,58,237,0.4)';
        btn.style.color = '#7c3aed';
        btn.style.background = 'rgba(124,58,237,0.12)';
    }

    // __SIM_STAGES_2__

    /* Stage 3 → 4: 用户提问 */
    function doStage4() {
        showScene(4);
        updatePipeline(4);
        // Draw scatter with all chunks (no query yet)
        drawScatter('sim-scatter-4', SCATTER_POS, CHUNK_COLORS, null, null, 0);
        // Typing effect
        var queryText = document.getElementById('sim-query-text');
        var cursor = document.getElementById('sim-cursor');
        if (queryText) {
            queryText.textContent = '';
            var charIdx = 0;
            var typeTimer = setInterval(function() {
                if (charIdx < QUERY.length) {
                    queryText.textContent += QUERY[charIdx];
                    charIdx++;
                } else {
                    clearInterval(typeTimer);
                    if (cursor) cursor.style.display = 'none';
                }
            }, 80);
        }
        desc.textContent = '用户提出了一个问题，系统需要从知识库中找到相关内容来回答。';
        btn.textContent = '🔢 查询向量化';
    }

    /* Stage 4 → 5: Query Embedding */
    function doStage5() {
        showScene(5);
        updatePipeline(5);
        // Draw scatter with all chunks, no query yet
        drawScatter('sim-scatter-5', SCATTER_POS, CHUNK_COLORS, null, null, 0);
        // Flip the query card
        var flipInner = document.getElementById('sim-query-flip-inner');
        if (flipInner) {
            setTimeout(function() {
                flipInner.classList.add('flipped');
            }, 600);
        }
        // After flip, add query point to scatter
        setTimeout(function() {
            drawScatter('sim-scatter-5', SCATTER_POS, CHUNK_COLORS, QUERY_POS, null, 0);
        }, 1400);
        desc.textContent = '用户的问题被同一个 Embedding 模型转化为向量——这样才能在同一空间中比较距离。';
        btn.textContent = '🔍 相似度检索';
    }

    /* Stage 5 → 6: 向量相似度检索 */
    function doStage6() {
        showScene(6);
        updatePipeline(6);
        // Animated radar sweep
        var progress = 0;
        var radarTimer = setInterval(function() {
            progress += 0.03;
            if (progress >= 1) {
                progress = 1;
                clearInterval(radarTimer);
                // Final state: show top-k highlighted
                drawScatter('sim-scatter-6', SCATTER_POS, CHUNK_COLORS, QUERY_POS, TOPK, 1);
                showTopKPanel();
            } else {
                drawScatter('sim-scatter-6', SCATTER_POS, CHUNK_COLORS, QUERY_POS, null, progress);
            }
        }, 40);

        function showTopKPanel() {
            var panel = document.getElementById('sim-topk-panel');
            if (!panel) return;
            panel.innerHTML = '<div style="font-weight:700;font-size:0.85em;color:var(--secondary);margin-bottom:4px;">🎯 Top-3 检索结果</div>';
            TOPK.forEach(function(tk, i) {
                var row = document.createElement('div');
                row.style.cssText = 'padding:10px 14px;background:var(--card-bg);border:2px solid ' + CHUNK_COLORS[tk.idx] + '40;border-radius:10px;font-size:0.78em;line-height:1.6;color:var(--text-secondary);opacity:0;transition:all 0.4s;';
                row.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                    '<span style="font-weight:700;color:' + CHUNK_COLORS[tk.idx] + ';">Chunk ' + (tk.idx + 1) + '</span>' +
                    '<span style="font-family:Monaco,monospace;color:var(--secondary);font-weight:600;">cos=' + tk.score.toFixed(2) + '</span></div>' +
                    '<div>' + CHUNKS[tk.idx].substring(0, 50) + '...</div>';
                panel.appendChild(row);
                setTimeout(function() { row.style.opacity = '1'; }, i * 250 + 200);
            });
        }
        desc.textContent = '通过计算向量间的余弦相似度，找到与问题最相关的 Top-3 个片段。';
        btn.textContent = '📝 构建提示词';
    }

    // __SIM_STAGES_3__

    /* Stage 6 → 7: Prompt 拼接 */
    function doStage7() {
        showScene(7);
        updatePipeline(7);
        // Fill context text
        var ctxText = document.getElementById('sim-prompt-ctx-text');
        if (ctxText) {
            ctxText.innerHTML = TOPK.map(function(tk) {
                return '<div style="margin-bottom:4px;"><span style="color:' + CHUNK_COLORS[tk.idx] + ';font-weight:600;">[C' + (tk.idx+1) + ']</span> ' + CHUNKS[tk.idx].substring(0, 60) + '...</div>';
            }).join('');
        }
        // Animate cards sliding in
        var cards = [
            document.getElementById('sim-prompt-sys'),
            document.getElementById('sim-prompt-ctx'),
            document.getElementById('sim-prompt-query')
        ];
        cards.forEach(function(c, i) {
            if (!c) return;
            c.style.opacity = '0';
            c.style.transform = i === 0 ? 'translateX(-40px)' : (i === 2 ? 'translateX(40px)' : 'translateY(30px)');
            c.style.transition = 'all 0.6s ease';
            setTimeout(function() {
                c.style.opacity = '1';
                c.style.transform = 'translate(0,0)';
            }, i * 300 + 200);
        });
        desc.textContent = '将系统指令、检索到的参考资料、用户问题拼接成完整的提示词，交给大模型。';
        btn.textContent = '🤖 发送给大模型';
    }

    /* Stage 7 → 8: LLM 生成回答 */
    function doStage8() {
        showScene(8);
        updatePipeline(8);
        var llmBox = document.getElementById('sim-llm-box');
        var thinking = document.getElementById('sim-thinking');
        var llmStatus = document.getElementById('sim-llm-status');
        var answerCard = document.getElementById('sim-answer-card');
        var answerText = document.getElementById('sim-answer-text');
        // Show thinking
        if (llmBox) llmBox.style.opacity = '1';
        if (thinking) thinking.style.display = 'block';
        if (answerCard) answerCard.style.opacity = '0';
        // After delay, show answer with typing
        setTimeout(function() {
            if (thinking) thinking.style.display = 'none';
            if (llmStatus) llmStatus.textContent = '生成完成 ✓';
            if (llmBox) {
                llmBox.style.borderColor = 'rgba(22,163,74,0.3)';
                var icon = document.getElementById('sim-llm-icon');
                if (icon) icon.textContent = '✅';
            }
            if (answerCard && answerText) {
                answerCard.style.opacity = '1';
                // Typing effect for answer (use innerHTML for highlights)
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = ANSWER;
                var plainText = tempDiv.textContent;
                answerText.textContent = '';
                var ci = 0;
                var ansTimer = setInterval(function() {
                    if (ci < plainText.length) {
                        answerText.textContent += plainText[ci];
                        ci++;
                    } else {
                        clearInterval(ansTimer);
                        // Replace with rich HTML after typing done
                        answerText.innerHTML = ANSWER;
                    }
                }, 30);
            }
        }, 2000);
        setTimeout(function() {
            desc.innerHTML = '🎉 <b>RAG 全流程完成！</b>大模型基于检索到的真实文档片段生成了有据可查的回答。';
            btn.textContent = '↺ 重新体验';
            btn.style.borderColor = 'rgba(var(--primary-rgb),0.4)';
            btn.style.color = 'var(--primary)';
            btn.style.background = 'rgba(var(--primary-rgb),0.12)';
        }, 2000 + 30 * 80 + 500);
    }

    /* 重置 */
    function resetAll() {
        stage = 0;
        showScene(0);
        updatePipeline(0);
        btn.style.borderColor = '';
        btn.style.color = '';
        btn.style.background = '';
        desc.textContent = '这是一份完整的企业知识文档。接下来，我们要让大模型能「读懂」它——点击按钮，开始 RAG 离线索引流程。';
        btn.textContent = '✂️ 开始切分';
    }

    /* 主按钮事件 */
    btn.onclick = function() {
        if (stage === 0) { stage = 1; doStage1(); }
        else if (stage === 1) { stage = 2; doStage2(); }
        else if (stage === 2) { stage = 3; doStage3(); }
        else if (stage === 3) { stage = 4; doStage4(); }
        else if (stage === 4) { stage = 5; doStage5(); }
        else if (stage === 5) { stage = 6; doStage6(); }
        else if (stage === 6) { stage = 7; doStage7(); }
        else if (stage === 7) { stage = 8; doStage8(); }
        else { resetAll(); }
    };

    // Init
    showScene(0);
    updatePipeline(0);
};

/* ── S040: 广义 RAG vs 狭义 RAG 路径点击 ── */
window.slideHooks['S040-broad-vs-narrow.html'] = function() {
    var pathBroad = document.getElementById('path-broad');
    var pathNarrow = document.getElementById('path-narrow');
    var broadExplain = document.getElementById('broad-explain');
    var narrowExplain = document.getElementById('narrow-explain');
    if (!pathBroad || !pathNarrow) return;

    var activePath = null;

    function highlightPath(which) {
        if (which === 'broad') {
            pathBroad.style.opacity = '1';
            pathNarrow.style.opacity = '0.2';
            // Glow nodes sequentially
            for (var i = 1; i <= 4; i++) {
                (function(idx) {
                    var node = document.getElementById('broad-node-' + idx);
                    if (node) {
                        setTimeout(function() {
                            node.style.borderColor = 'rgba(245,158,11,0.7)';
                            node.style.boxShadow = '0 0 16px rgba(245,158,11,0.25)';
                        }, idx * 200);
                    }
                })(i);
                var nNode = document.getElementById('narrow-node-' + i);
                if (nNode) {
                    nNode.style.borderColor = 'rgba(59,130,246,0.15)';
                    nNode.style.boxShadow = 'none';
                }
            }
            if (broadExplain) broadExplain.style.display = 'block';
            if (narrowExplain) narrowExplain.style.display = 'none';
            activePath = 'broad';
        } else {
            pathNarrow.style.opacity = '1';
            pathBroad.style.opacity = '0.2';
            for (var j = 1; j <= 4; j++) {
                (function(idx) {
                    var node = document.getElementById('narrow-node-' + idx);
                    if (node) {
                        setTimeout(function() {
                            node.style.borderColor = 'rgba(59,130,246,0.7)';
                            node.style.boxShadow = '0 0 16px rgba(59,130,246,0.25)';
                        }, idx * 200);
                    }
                })(j);
                var bNode = document.getElementById('broad-node-' + j);
                if (bNode) {
                    bNode.style.borderColor = 'rgba(245,158,11,0.15)';
                    bNode.style.boxShadow = 'none';
                }
            }
            if (narrowExplain) narrowExplain.style.display = 'block';
            if (broadExplain) broadExplain.style.display = 'none';
            activePath = 'narrow';
        }
    }

    pathBroad.onclick = function() {
        highlightPath(activePath === 'broad' ? 'narrow' : 'broad');
    };
    pathNarrow.onclick = function() {
        highlightPath(activePath === 'narrow' ? 'broad' : 'narrow');
    };
};

/* ── S044: Token 预算控制滑块 ── */
window.slideHooks['S044-token-budget.html'] = function() {
    var slider = document.getElementById('token-slider');
    var sliderValue = document.getElementById('slider-value');
    var statsText = document.getElementById('stats-text');
    var budgetBar = document.getElementById('budget-bar');
    if (!slider || !sliderValue) return;

    var CARD_COUNT = 5;
    var cards = [];
    var statuses = [];
    for (var i = 1; i <= CARD_COUNT; i++) {
        cards.push(document.getElementById('chunk-card-' + i));
        statuses.push(document.getElementById('chunk-status-' + i));
    }

    function update() {
        var budget = parseInt(slider.value);
        sliderValue.textContent = budget;
        var cumulative = 0;
        var selectedCount = 0;
        var criticalIdx = -1;

        for (var i = 0; i < CARD_COUNT; i++) {
            var card = cards[i];
            var status = statuses[i];
            if (!card) continue;
            var tokens = parseInt(card.getAttribute('data-tokens'));
            var nextCum = cumulative + tokens;

            if (nextCum <= budget) {
                // Fits within budget
                cumulative = nextCum;
                selectedCount++;
                card.style.opacity = '1';
                card.style.borderColor = 'rgba(34,197,94,0.5)';
                card.style.boxShadow = '0 2px 12px rgba(34,197,94,0.12)';
                card.style.animation = 'none';
                if (status) {
                    status.style.display = 'flex';
                    status.textContent = '\u2713';
                    status.style.background = '#22c55e';
                    status.style.color = '#fff';
                    status.style.animation = 'none';
                }
            } else if (criticalIdx === -1) {
                // First card that causes overflow — critical card
                criticalIdx = i;
                card.style.opacity = '0.7';
                card.style.borderColor = '#f59e0b';
                card.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.35)';
                card.style.animation = 'tokenPulse 1.5s ease-in-out infinite';
                if (status) {
                    status.style.display = 'flex';
                    status.textContent = '!';
                    status.style.background = '#f59e0b';
                    status.style.color = '#fff';
                    status.style.animation = 'none';
                }
            } else {
                // Beyond budget
                card.style.opacity = '0.25';
                card.style.borderColor = 'var(--card-border)';
                card.style.boxShadow = 'none';
                card.style.animation = 'none';
                if (status) {
                    status.style.display = 'flex';
                    status.textContent = '\u2717';
                    status.style.background = '#ef4444';
                    status.style.color = '#fff';
                    status.style.animation = 'none';
                }
            }
        }

        // Update stats
        var ratio = budget > 0 ? cumulative / budget : 0;
        var pct = Math.min(ratio * 100, 100);
        if (statsText) {
            statsText.textContent = '\u5DF2\u9009 ' + selectedCount + ' \u4E2A\u7247\u6BB5 | \u5171 ' + cumulative + ' tokens / \u9884\u7B97 ' + budget + ' tokens';
        }
        if (budgetBar) {
            budgetBar.style.width = pct + '%';
            if (ratio < 0.6) {
                budgetBar.style.background = 'linear-gradient(90deg,#22c55e,#22c55e)';
            } else if (ratio < 0.85) {
                budgetBar.style.background = 'linear-gradient(90deg,#22c55e,#f59e0b)';
            } else {
                budgetBar.style.background = 'linear-gradient(90deg,#f59e0b,#ef4444)';
            }
        }
    }

    // Inject keyframes for pulse animation if not already present
    if (!document.getElementById('token-pulse-style')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'token-pulse-style';
        styleEl.textContent = '@keyframes tokenPulse{0%,100%{box-shadow:0 0 0 2px rgba(245,158,11,0.35)}50%{box-shadow:0 0 0 5px rgba(245,158,11,0.55)}}';
        document.head.appendChild(styleEl);
    }

    slider.oninput = update;
    update();
};

/* ── S045: Agentic RAG Agent 决策循环 ── */
window.slideHooks['S045-rag-gen4.html'] = function() {
    var core = document.getElementById('agent-core');
    var desc = document.getElementById('cycle-desc');
    if (!core || !desc) return;

    var PHASES = [
        { id: 'cycle-0', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', text: '分析问题复杂度，决定检索策略和工具调用顺序' },
        { id: 'cycle-1', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', text: '调用向量检索、数据库查询等工具获取信息' },
        { id: 'cycle-2', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', text: '评估检索结果的质量和相关性，判断是否足够' },
        { id: 'cycle-3', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', text: '结果不够好？修正查询策略，重新进入规划阶段' }
    ];

    var current = 0;

    function highlight(idx) {
        PHASES.forEach(function(p, i) {
            var el = document.getElementById(p.id);
            if (!el) return;
            if (i === idx) {
                el.style.background = p.bg;
                el.style.color = p.color;
                el.style.fontWeight = '600';
            } else {
                el.style.background = 'transparent';
                el.style.color = 'var(--text-dim)';
                el.style.fontWeight = 'normal';
            }
        });
        desc.textContent = PHASES[idx].text;
        desc.style.color = PHASES[idx].color;
        core.style.borderColor = PHASES[idx].color;
        core.style.boxShadow = '0 0 20px ' + PHASES[idx].color + '40';
    }

    core.onclick = function() {
        current = (current + 1) % PHASES.length;
        highlight(current);
        core.style.transform = 'scale(1.15)';
        setTimeout(function() { core.style.transform = 'scale(1)'; }, 200);
    };

    highlight(0);
};
