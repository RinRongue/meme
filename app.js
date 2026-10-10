const IMAGE_MANIFEST_URL = "meme-manifest.json";
const PAGE_SIZE = 50;
const collator = new Intl.Collator("zh-Hans-CN", { numeric: true, sensitivity: "base" });

const state = { all: [], visible: [], query: "", page: 1 };

const els = {
  gallery: document.querySelector("#gallery"),
  template: document.querySelector("#cardTemplate"),
  searchInput: document.querySelector("#searchInput"),
  clearSearch: document.querySelector("#clearSearch"),
  resultText: document.querySelector("#resultText"),
  totalCount: document.querySelector("#totalCount"),
  visibleCount: document.querySelector("#visibleCount"),
  emptyState: document.querySelector("#emptyState"),
  shuffleBtn: document.querySelector("#shuffleBtn"),
  pagination: document.querySelector("#pagination"),
  previousPage: document.querySelector("#previousPage"),
  nextPage: document.querySelector("#nextPage"),
  pageInfo: document.querySelector("#pageInfo"),
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("zh-Hans-CN")
    .replace(/[\s_\-()[\]{}【】（）《》.,，。!！?？:：]+/g, "");
}

function displayName(fileName) { return fileName.replace(/\.[^.]+$/, ""); }
function encodePath(filePath) { return filePath.split("/").map((segment) => encodeURIComponent(segment)).join("/"); }

async function loadImages() {
  const response = await fetch(IMAGE_MANIFEST_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("无法加载图片清单：" + response.status);
  const data = await response.json();
  return Array.isArray(data.images) ? data.images : [];
}

function filterImages() {
  state.page = 1;
  const needle = normalizeText(state.query);
  state.visible = needle ? state.all.filter((item) => normalizeText(item.name).includes(needle)) : [...state.all];
}

function render() {
  const pageCount = Math.max(1, Math.ceil(state.visible.length / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pageCount);
  const start = (state.page - 1) * PAGE_SIZE;
  const pageImages = state.visible.slice(start, start + PAGE_SIZE);
  els.gallery.innerHTML = "";
  const fragment = document.createDocumentFragment();
  pageImages.forEach((item, index) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    const img = node.querySelector("img");
    const link = node.querySelector(".image-link");
    const title = node.querySelector("h3");
    const copy = node.querySelector(".copy-btn");
    const encodedSrc = encodePath(item.path);
    const name = displayName(item.name);
    node.style.animationDelay = Math.min(index * 24, 360) + "ms";
    img.src = encodedSrc;
    img.alt = name;
    link.href = encodedSrc;
    title.textContent = name;
    title.title = item.name;
    copy.addEventListener("click", async () => {
      const url = new URL(encodedSrc, window.location.href).href;
      try {
        await navigator.clipboard.writeText(url);
        copy.textContent = "已复制";
        setTimeout(() => { copy.textContent = "复制"; }, 1200);
      } catch {
        window.prompt("复制这个链接：", url);
      }
    });
    fragment.appendChild(node);
  });
  els.gallery.appendChild(fragment);
  els.totalCount.textContent = state.all.length;
  els.visibleCount.textContent = pageImages.length;
  els.pagination.hidden = state.visible.length <= PAGE_SIZE;
  els.previousPage.disabled = state.page === 1;
  els.nextPage.disabled = state.page === pageCount;
  els.pageInfo.textContent = "第 " + state.page + " / " + pageCount + " 页";
  els.emptyState.hidden = state.visible.length !== 0;
  const query = state.query.trim();
  els.resultText.textContent = query ? "“" + query + "” 找到 " + state.visible.length + " 张图片" : "共 " + state.all.length + " 张图片，按文件名排序";
  if (pageImages.length) els.resultText.textContent += "，当前显示第 " + (start + 1) + "–" + (start + pageImages.length) + " 张";
}

function shuffleVisible() {
  state.page = 1;
  for (let i = state.visible.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.visible[i], state.visible[j]] = [state.visible[j], state.visible[i]];
  }
  render();
}

function bindEvents() {
  const changePage = (offset) => {
    state.page += offset;
    render();
    els.gallery.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  els.previousPage.addEventListener("click", () => changePage(-1));
  els.nextPage.addEventListener("click", () => changePage(1));
  els.searchInput.addEventListener("input", (event) => { state.query = event.target.value; filterImages(); render(); });
  els.clearSearch.addEventListener("click", () => { els.searchInput.value = ""; state.query = ""; filterImages(); render(); els.searchInput.focus(); });
  els.shuffleBtn.addEventListener("click", shuffleVisible);
}

async function init() {
  bindEvents();
  try {
    const images = await loadImages();
    state.all = images.filter((item) => item && item.name && item.path).sort((a, b) => collator.compare(a.name, b.name));
    filterImages();
    render();
  } catch (error) {
    els.resultText.textContent = "图片清单加载失败，请先运行 scripts/generate-manifest.mjs。";
    els.emptyState.hidden = false;
    els.emptyState.querySelector("h2").textContent = "没有可展示的图片";
    els.emptyState.querySelector("p").textContent = error.message;
  }
}

init();
