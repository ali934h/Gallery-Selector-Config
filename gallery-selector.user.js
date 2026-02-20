// ==UserScript==
// @name         Gallery Selector Config
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Select and copy gallery image links with customizable CSS selectors
// @author       ali934h
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────────────────────
  // CONFIGURATION: Replace YOUR_API_KEY with your actual API key
  // Get your API key from: https://github.com/ali934h/Gallery-Security-Selectors
  // ────────────────────────────────────────────────────────────────────────────
  const API_KEY = 'YOUR_API_KEY'; // Replace this with your actual API key

  const DEFAULT_CONFIG = {
    cardSelector:      'ul.list-gallery li',
    linkSelector:      'figure.has-img > a[href]',
    containerSelector: 'ul.list-gallery'
  };

  let config = { ...DEFAULT_CONFIG };
  let selectionMode = false;
  let galleryObserver = null;
  let sitesData = [];

  // ─── UI Panel ─────────────────────────────────────────────────────────────
  const configPanel = document.createElement('div');
  configPanel.id = '__config-panel__';
  Object.assign(configPanel.style, {
    position:     'fixed',
    top:          '12px',
    right:        '12px',
    zIndex:       '2147483647',
    background:   '#1a1a1a',
    border:       '2px solid #333',
    borderRadius: '8px',
    padding:      '12px',
    fontFamily:   'sans-serif',
    fontSize:     '12px',
    color:        '#ddd',
    boxShadow:    '0 4px 20px rgba(0,0,0,0.8)',
    minWidth:     '280px',
    maxWidth:     '320px',
  });

  configPanel.innerHTML = `
    <div style="font-weight:600;margin-bottom:8px;color:#0cf;">🔧 Gallery Selector Config</div>

    <div style="margin-bottom:10px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Preset Sites</label>
      <select id="__preset-sel__" style="width:100%;padding:6px;border:1px solid #555;border-radius:4px;background:#2a2a2a;color:#fff;font-size:12px;box-sizing:border-box;cursor:pointer;">
        <option value="">-- Select a preset site --</option>
      </select>
    </div>

    <div style="margin-bottom:10px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Card Selector</label>
      <input id="__card-sel__" style="width:100%;padding:6px;border:1px solid #555;border-radius:4px;background:#2a2a2a;color:#fff;font-size:12px;box-sizing:border-box;">
    </div>

    <div style="margin-bottom:10px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Link Selector (inside card)</label>
      <input id="__link-sel__" style="width:100%;padding:6px;border:1px solid #555;border-radius:4px;background:#2a2a2a;color:#fff;font-size:12px;box-sizing:border-box;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:4px;font-weight:500;">Container Selector (for lazy-load)</label>
      <input id="__container-sel__" style="width:100%;padding:6px;border:1px solid #555;border-radius:4px;background:#2a2a2a;color:#fff;font-size:12px;box-sizing:border-box;">
    </div>

    <div style="display:flex;gap:6px;">
      <button id="__test-btn__"  style="flex:1;padding:6px 8px;background:#444;color:#fff;border:1px solid #666;border-radius:4px;font-size:11px;cursor:pointer;">Test Config</button>
      <button id="__apply-btn__" style="flex:1;padding:6px 8px;background:#0a6;color:#fff;border:1px solid #0d8;border-radius:4px;font-size:11px;cursor:pointer;font-weight:600;">Apply</button>
    </div>

    <div id="__status__" style="margin-top:8px;padding:4px 6px;border-radius:3px;font-size:11px;text-align:center;display:none;"></div>
  `;

  const toolbar = document.createElement('div');
  Object.assign(toolbar.style, { display:'flex', gap:'8px', marginTop:'12px' });

  function makeBtn(text, title) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    Object.assign(btn.style, {
      flex: '1', padding: '8px 10px', background: '#222', color: '#fff',
      border: '2px solid #555', borderRadius: '6px', cursor: 'pointer',
      fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
    });
    return btn;
  }

  const btnToggle = makeBtn('☑ Select', 'Toggle selection mode');
  const btnCopy   = makeBtn('⧉ Copy Links', 'Copy selected links');
  toolbar.appendChild(btnToggle);
  toolbar.appendChild(btnCopy);
  configPanel.appendChild(toolbar);
  document.body.appendChild(configPanel);

  // ─── Wire inputs ──────────────────────────────────────────────────────────
  const presetSel    = document.getElementById('__preset-sel__');
  const inpCard      = document.getElementById('__card-sel__');
  const inpLink      = document.getElementById('__link-sel__');
  const inpContainer = document.getElementById('__container-sel__');
  const btnTest      = document.getElementById('__test-btn__');
  const btnApply     = document.getElementById('__apply-btn__');
  const statusDiv    = document.getElementById('__status__');

  inpCard.value      = config.cardSelector;
  inpLink.value      = config.linkSelector;
  inpContainer.value = config.containerSelector;

  // ─── Fetch preset sites ───────────────────────────────────────────────────
  function loadPresets() {
    if (API_KEY === 'YOUR_API_KEY') {
      showStatus('⚠ Please set your API key in the script', false);
      return;
    }

    showStatus('⏳ Loading presets...', true);
    fetch('https://gallery-security-selectors.pages.dev/public-api/sites', {
      headers: {
        'X-API-Key': API_KEY
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.sites)) {
        sitesData = data.sites;
        data.sites.forEach(site => {
          const option = document.createElement('option');
          option.value = site.site;
          option.textContent = site.site;
          presetSel.appendChild(option);
        });
        showStatus(`✅ Loaded ${data.count} presets`, true);
        setTimeout(() => statusDiv.style.display = 'none', 2000);
      } else {
        showStatus('⚠ No presets available', false);
      }
    })
    .catch(err => {
      showStatus(`❌ Failed to load presets: ${err.message}`, false);
    });
  }

  // ─── Preset selection handler ─────────────────────────────────────────────
  presetSel.addEventListener('change', () => {
    const selectedSite = presetSel.value;
    if (!selectedSite) return;

    const preset = sitesData.find(s => s.site === selectedSite);
    if (preset) {
      inpCard.value      = preset.cardSelector;
      inpLink.value      = preset.linkSelector;
      inpContainer.value = preset.containerSelector;
      showStatus(`✅ Loaded preset for ${selectedSite}`, true);
      setTimeout(() => statusDiv.style.display = 'none', 2000);
    }
  });

  // Load presets on initialization
  loadPresets();

  function showStatus(msg, ok) {
    statusDiv.textContent = msg;
    statusDiv.style.background = ok ? 'rgba(0,200,100,0.3)' : 'rgba(255,100,100,0.3)';
    statusDiv.style.color = ok ? '#0cc' : '#f88';
    statusDiv.style.display = 'block';
  }

  btnTest.addEventListener('click', () => {
    try {
      const cards = document.querySelectorAll(inpCard.value.trim());
      let linksOk = 0;
      cards.forEach(c => {
        const testSelector = inpLink.value.trim();
        let finalSelector = testSelector;
        if (/^[>+~]/.test(testSelector)) {
          finalSelector = ':scope ' + testSelector;
        }
        const a = c.querySelector(finalSelector);
        if (a && a.href) linksOk++;
      });
      showStatus(`✅ ${cards.length} cards · ${linksOk}/${cards.length} have links`, true);
    } catch (e) {
      showStatus(`❌ ${e.message}`, false);
    }
  });

  btnApply.addEventListener('click', () => {
    config = {
      cardSelector:      inpCard.value.trim(),
      linkSelector:      inpLink.value.trim(),
      containerSelector: inpContainer.value.trim(),
    };
    showStatus('✅ Config applied!', true);
    if (selectionMode) { stopSelectionMode(); startSelectionMode(); }
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function getCards()      { return document.querySelectorAll(config.cardSelector); }
  function getContainer()  { return document.querySelector(config.containerSelector) || document.body; }
  
  function getLinkFromCard(cardEl) {
    let selector = config.linkSelector;
    // If starts with combinator, add :scope prefix
    if (/^[>+~]/.test(selector.trim())) {
      selector = ':scope ' + selector;
    }
    const a = cardEl.querySelector(selector);
    return a && a.href ? a.href : null;
  }

  // ─── KEY FIX: force card to be a proper positioning context ───────────────
  function prepareCard(cardEl) {
    const cs = getComputedStyle(cardEl);

    // Force relative positioning so absolute children are anchored here
    if (cs.position === 'static') {
      cardEl.style.position = 'relative';
    }

    // Force overflow visible so the checkbox badge is never clipped
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden') {
      cardEl.dataset.__origOverflow__ = cs.overflow;
      cardEl.style.overflow = 'visible';
    }
  }

  function restoreCard(cardEl) {
    if (cardEl.dataset.__origOverflow__ !== undefined) {
      cardEl.style.overflow = cardEl.dataset.__origOverflow__;
      delete cardEl.dataset.__origOverflow__;
    }
  }

  // ─── Card behavior ────────────────────────────────────────────────────────
  const attached = new WeakMap();

  function attachCardBehavior(cardEl) {
    if (attached.has(cardEl)) return;

    prepareCard(cardEl);

    // Checkbox badge
    const badge = document.createElement('div');
    badge.className = '__gallery-cb__';
    Object.assign(badge.style, {
      position:    'absolute',
      top:         '6px',
      left:        '6px',
      zIndex:      '2147483646',
      background:  'rgba(0,0,0,.65)',
      borderRadius:'5px',
      padding:     '4px 5px',
      lineHeight:  '0',
      pointerEvents: 'none',
    });

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    Object.assign(cb.style, {
      display:      'block',
      width:        '18px',
      height:       '18px',
      margin:       '0',
      cursor:       'pointer',
      accentColor:  '#0cf',
      pointerEvents:'auto',
    });

    badge.appendChild(cb);
    cardEl.appendChild(badge);

    // Selected highlight
    cb.addEventListener('change', () => {
      cardEl.style.outline       = cb.checked ? '3px solid #0cf' : '';
      cardEl.style.outlineOffset = cb.checked ? '2px' : '';
    });

    // Click anywhere on card = toggle checkbox + block navigation
    const clickHandler = (e) => {
      // If user clicked the checkbox directly, let it handle itself
      if (e.target === cb) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    };
    cardEl.addEventListener('click', clickHandler, true);
    cardEl.style.cursor = 'pointer';

    attached.set(cardEl, { badge, clickHandler });
  }

  function detachCardBehavior(cardEl) {
    const data = attached.get(cardEl);
    if (!data) return;
    data.badge.remove();
    cardEl.removeEventListener('click', data.clickHandler, true);
    cardEl.style.cursor       = '';
    cardEl.style.outline      = '';
    cardEl.style.outlineOffset= '';
    restoreCard(cardEl);
    attached.delete(cardEl);
  }

  // ─── Selection mode ───────────────────────────────────────────────────────
  function startSelectionMode() {
    getCards().forEach(attachCardBehavior);

    galleryObserver = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(config.cardSelector)) attachCardBehavior(node);
          node.querySelectorAll && node.querySelectorAll(config.cardSelector).forEach(attachCardBehavior);
        });
      });
    });
    galleryObserver.observe(getContainer(), { childList: true, subtree: true });
  }

  function stopSelectionMode() {
    galleryObserver && galleryObserver.disconnect();
    galleryObserver = null;
    getCards().forEach(detachCardBehavior);
  }

  // ─── Toggle button ────────────────────────────────────────────────────────
  btnToggle.addEventListener('click', () => {
    selectionMode = !selectionMode;
    if (selectionMode) {
      startSelectionMode();
      btnToggle.textContent      = '✖ Cancel Select';
      btnToggle.style.background = '#0a6';
      btnToggle.style.border     = '2px solid #0d8';
    } else {
      stopSelectionMode();
      btnToggle.textContent      = '☑ Select';
      btnToggle.style.background = '#222';
      btnToggle.style.border     = '2px solid #555';
    }
  });

  // ─── Copy button ──────────────────────────────────────────────────────────
  btnCopy.addEventListener('click', () => {
    const checkedCbs = Array.from(
      document.querySelectorAll('.__gallery-cb__ input[type=checkbox]:checked')
    );

    let links;
    if (checkedCbs.length === 0) {
      links = Array.from(getCards()).map(getLinkFromCard).filter(Boolean);
      if (!links.length) { alert('No links found with current config.'); return; }
    } else {
      links = checkedCbs
        .map(cb => getLinkFromCard(cb.closest(config.cardSelector) || cb.closest('[style*="position"]')))
        .filter(Boolean);
    }

    const text = links.join('\n');
    const msg  = checkedCbs.length ? `${links.length} selected` : `all (${links.length})`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => flash(btnCopy, `✔ Copied ${msg}`));
    } else {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      Object.assign(ta.style, { position:'fixed', opacity:'0' });
      document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      flash(btnCopy, `✔ Copied ${msg}`);
    }
  });

  function flash(btn, msg) {
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.style.background = '#0a6';
    setTimeout(() => {
      btn.textContent    = orig;
      btn.style.background = selectionMode && btn === btnToggle ? '#0a6' : '#222';
    }, 2000);
  }

})();