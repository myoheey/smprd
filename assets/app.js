(function () {
  // 복사 버튼: .prompt 안의 pre 내용을 클립보드로
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove(); return ok;
    }
  }
  function flash(btn, ok) {
    const label = btn.dataset.label || btn.textContent;
    btn.dataset.label = label;
    btn.textContent = ok ? '복사됨' : '복사 실패 — 직접 선택해 복사';
    btn.classList.toggle('done', ok);
    setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 1600);
  }
  document.querySelectorAll('.prompt').forEach(box => {
    const btn = box.querySelector('.copy');
    const pre = box.querySelector('pre');
    if (btn && pre) btn.addEventListener('click', async () => flash(btn, await copyText(pre.innerText.trim())));
  });

  // 저장소 (실패해도 페이지는 동작)
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // 체크리스트 진행도
  document.querySelectorAll('[data-checks]').forEach(list => {
    const key = 'checks:' + list.dataset.checks;
    const boxes = [...list.querySelectorAll('input[type=checkbox]')];
    const out = document.querySelector(`[data-checks-out="${list.dataset.checks}"]`);
    const saved = store.get(key) || [];
    boxes.forEach((b, i) => { b.checked = !!saved[i]; });
    const update = () => {
      const n = boxes.filter(b => b.checked).length;
      if (out) out.textContent = n === boxes.length ? `${n} / ${boxes.length} 완료 — 다음 단계로 넘어가도 좋음` : `${n} / ${boxes.length} 확인`;
      store.set(key, boxes.map(b => b.checked));
    };
    boxes.forEach(b => b.addEventListener('change', update));
    update();
  });

  // PRD 작성기
  const builder = document.querySelector('[data-prd-builder]');
  if (builder) {
    const KEY = 'prd-draft';
    const fields = [...builder.querySelectorAll('[data-field]')];
    const saved = store.get(KEY) || {};
    fields.forEach(f => { if (saved[f.dataset.field]) f.value = saved[f.dataset.field]; });
    const save = () => store.set(KEY, Object.fromEntries(fields.map(f => [f.dataset.field, f.value])));
    fields.forEach(f => f.addEventListener('input', save));
    const toText = () => fields.map(f => {
      const v = f.value.trim() || '(작성 전)';
      return f.dataset.field === 'name' ? `# 학습도구 이름: ${v}` : `## ${f.dataset.title}\n${v}`;
    }).join('\n');
    const copyBtn = document.querySelector('[data-prd-copy]');
    if (copyBtn) copyBtn.addEventListener('click', async () => flash(copyBtn, await copyText(toText())));
    const clearBtn = document.querySelector('[data-prd-clear]');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (!confirm('작성한 내용을 모두 지울까요?')) return;
      fields.forEach(f => { f.value = ''; }); save();
    });
  }

  // 탭
  const tabs = document.querySelector('[role=tablist]');
  if (tabs) {
    const buttons = [...tabs.querySelectorAll('[role=tab]')];
    const select = (id, push) => {
      buttons.forEach(b => {
        const on = b.getAttribute('aria-controls') === id;
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
      });
      if (push) history.replaceState(null, '', '#' + id);
    };
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(b.getAttribute('aria-controls'), true));
      b.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = buttons[(i + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length];
        next.focus(); next.click();
      });
    });
    const initial = buttons.find(b => '#' + b.getAttribute('aria-controls') === location.hash);
    select((initial || buttons[0]).getAttribute('aria-controls'), false);
  }

  // 이미지 확대
  const lb = document.createElement('div');
  lb.className = 'lightbox'; lb.hidden = true;
  lb.innerHTML = '<img alt="">';
  document.body.appendChild(lb);
  lb.addEventListener('click', () => { lb.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });
  document.querySelectorAll('figure img').forEach(img => img.addEventListener('click', () => {
    lb.querySelector('img').src = img.src; lb.querySelector('img').alt = img.alt; lb.hidden = false;
  }));
})();
