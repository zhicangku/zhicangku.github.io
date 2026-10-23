/* 知仓库 — 渲染、筛选与下载弹窗逻辑(原生 JS,零依赖) */

const state = { q: '', platform: 'all', cat: 'all' };
let DATA = { site: {}, categories: [], apps: [] };
let currentList = []; // 当前渲染的卡片列表,用于点击定位

const $ = (sel) => document.querySelector(sel);
const grid = $('#appGrid');
const catChips = $('#catChips');
const emptyState = $('#emptyState');
const resultCount = $('#resultCount');
const modalMask = $('#modalMask');

/* ---------- 初始化 ---------- */
async function init() {
  try {
    const res = await fetch('./data.json');
    DATA = await res.json();
  } catch (e) {
    grid.innerHTML = '<p style="grid-column:1/-1;color:#999">data.json 加载失败:请通过本地服务访问(如 python -m http.server 8080)。</p>';
    return;
  }

  applySiteConfig();
  renderCatChips();
  bindEvents();
  render();
}

function applySiteConfig() {
  const { site } = DATA;
  document.title = `${site.name} · 优质软件与资源分享`;
  $('#siteName').textContent = site.name;
  $('#footName').textContent = site.name;
  $('#footDesc').textContent = site.desc;
  $('#footYear').textContent = new Date().getFullYear();
  $('#statApps').textContent = DATA.apps.length;
  $('#statCats').textContent = DATA.categories.length;
}

/* ---------- 分类筛选条 ---------- */
function renderCatChips() {
  const all = `<button class="cat-chip is-active" data-cat="all">全部</button>`;
  const chips = DATA.categories.map((c) =>
    `<button class="cat-chip" data-cat="${c.id}">${c.name}</button>`);
  catChips.innerHTML = all + chips.join('');
}

/* ---------- 事件 ---------- */
function bindEvents() {
  $('#searchInput').addEventListener('input', (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });

  document.querySelectorAll('.platform-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelector('.platform-btn.is-active')?.classList.remove('is-active');
      btn.classList.add('is-active');
      state.platform = btn.dataset.platform;
      render();
    });
  });

  catChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    catChips.querySelector('.is-active')?.classList.remove('is-active');
    chip.classList.add('is-active');
    state.cat = chip.dataset.cat;
    render();
  });

  // ESC:优先关闭弹窗,其次清空搜索
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modalMask.hidden) { closeModal(); return; }
    if (state.q) {
      $('#searchInput').value = '';
      state.q = '';
      render();
    }
  });

  // 点击整张卡片打开下载弹窗(直达链接的卡片除外,由 <a> 原生跳转)
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || card.tagName === 'A') return;
    const app = currentList[Number(card.dataset.i)];
    if (app) openModal(app);
  });
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const card = e.target.closest('.card');
    if (!card || card.tagName === 'A') return;
    const app = currentList[Number(card.dataset.i)];
    if (app) openModal(app);
  });

  // 弹窗关闭:遮罩空白处 / 关闭按钮
  modalMask.addEventListener('click', (e) => {
    if (e.target === modalMask) closeModal();
  });
  $('#modalClose').addEventListener('click', closeModal);
}

/* ---------- 筛选 ---------- */
function filtered() {
  return DATA.apps.filter((a) => {
    // 平台筛选只约束软件类资源;无平台信息(如视频、资料)在任何标签下都显示
    if (state.platform !== 'all' && a.os.length && !a.os.includes(state.platform)) return false;
    if (state.cat !== 'all' && a.cat !== state.cat) return false;
    if (state.q) {
      const catName = DATA.categories.find((c) => c.id === a.cat)?.name || '';
      const hay = `${a.name} ${a.desc} ${a.tags.join(' ')} ${catName}`.toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  });
}

/* ---------- 解析下载方式列表 ----------
   dl 支持三种写法:
   1. 字符串     "url"                 → [{name: "下载链接", url}]
   2. 平台对象   {win, mac}            → [{name: "Windows 版" ...}, {name: "macOS 版" ...}]
   3. 链接数组   [{name, url}, ...]    → 原样使用                                    */
function parseDl(app) {
  if (Array.isArray(app.dl)) return app.dl;
  if (typeof app.dl === 'string') return [{ name: '下载链接', url: app.dl }];
  const osName = { win: 'Windows 版', mac: 'macOS 版', linux: 'Linux 版', android: 'Android 版' };
  return Object.entries(app.dl)
    .map(([os, url]) => ({ name: osName[os] || os, url }));
}

/* ---------- 渲染卡片 ---------- */
function render() {
  const list = filtered();
  currentList = list;
  const catMap = Object.fromEntries(DATA.categories.map((c) => [c.id, c]));

  resultCount.textContent = `共 ${DATA.apps.length} 款资源,当前显示 ${list.length} 款 · 点击卡片查看下载方式`;

  if (!list.length) {
    grid.innerHTML = '';
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  grid.innerHTML = list.map((app, i) => {
    const cat = catMap[app.cat] || { color: '#8a8a8a' };
    // 平台与标签合并展示在同一区块
    const meta =
      app.os.map((os) => `<span class="os-badge">${os === 'win' ? 'Windows' : os === 'mac' ? 'macOS' : os === 'linux' ? 'Linux' : 'Android'}</span>`).join('') +
      app.tags.map((t) => `<span class="tag">${t}</span>`).join('');

    // 带 link 的资源(如本站工具)整卡直达,不走下载弹窗
    if (app.link) {
      return `
      <a class="card" href="${app.link}" aria-label="打开 ${app.name}">
        <div class="card-head">
          <span class="app-icon" style="background:${cat.color}">${app.name[0].toUpperCase()}</span>
          <h3>${app.name}<span class="ver">${app.ver}</span></h3>
        </div>
        <p class="card-desc">${app.desc}</p>
        <div class="card-meta">${meta}</div>
      </a>`;
    }

    return `
      <article class="card" data-i="${i}" tabindex="0" role="button" aria-label="查看 ${app.name} 的下载方式">
        <div class="card-head">
          <span class="app-icon" style="background:${cat.color}">${app.name[0].toUpperCase()}</span>
          <h3>${app.name}<span class="ver">${app.ver}</span></h3>
        </div>
        <p class="card-desc">${app.desc}</p>
        <div class="card-meta">${meta}</div>
      </article>`;
  }).join('');
}

/* ---------- 下载弹窗 ---------- */
function openModal(app) {
  const cat = DATA.categories.find((c) => c.id === app.cat);
  const icon = $('#modalIcon');
  icon.textContent = app.name[0].toUpperCase();
  icon.style.background = cat?.color || '#8a8a8a';
  $('#modalTitle').textContent = app.name;
  $('#modalVer').textContent = app.ver;
  $('#modalDesc').textContent = app.desc;

  $('#dlList').innerHTML = parseDl(app)
    .map((d) => `
      <a class="dl-row" href="${d.url}" target="_blank" rel="noopener">
        <span>${d.name || '下载链接'}</span>
        <span class="dl-go">前往下载 ↗</span>
      </a>`)
    .join('');

  modalMask.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalMask.hidden = true;
  document.body.style.overflow = '';
}

init();
