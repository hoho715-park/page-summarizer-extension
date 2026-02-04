document.getElementById("summarizeBtn").addEventListener("click", async () => {
  const resultEl = document.getElementById("result");
  const loadingEl = document.getElementById("loading");

  resultEl.style.display = "none";
  loadingEl.style.display = "flex";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // content script를 직접 실행
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        text: document.body.innerText,
        title: document.title,
      }),
    });

    const { text, title } = results[0]?.result || {};

    if (!text) {
      resultEl.innerHTML =
        '<div class="empty-state">페이지 내용을 가져오지 못했습니다.</div>';
    } else {
      const summaryHtml = createSummaryHtml(text, title);
      resultEl.innerHTML = summaryHtml;
      resultEl.classList.remove("empty-state");
    }
  } catch (error) {
    console.error("오류:", error);
    resultEl.innerHTML =
      '<div class="empty-state">페이지를 요약할 수 없습니다.<br><small>(chrome:// 페이지 등은 지원되지 않습니다)</small></div>';
  } finally {
    loadingEl.style.display = "none";
    resultEl.style.display = "block";
  }
});

function createSummaryHtml(text, title) {
  const sentences = extractKeyPoints(text);

  if (sentences.length === 0) {
    return '<div class="empty-state">요약할 내용이 없습니다.</div>';
  }

  let html = "";

  // 페이지 제목 표시
  if (title) {
    const cleanTitle = title.length > 50 ? title.substring(0, 50) + "..." : title;
    html += `
      <div class="page-title">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        ${escapeHtml(cleanTitle)}
      </div>
    `;
  }

  // 핵심 포인트 표시
  sentences.forEach((sentence, index) => {
    html += `
      <div class="summary-item">
        <div class="summary-number">${index + 1}</div>
        <div class="summary-text">${escapeHtml(sentence)}</div>
      </div>
    `;
  });

  return html;
}

function extractKeyPoints(text) {
  if (!text || text.trim().length === 0) return [];

  // 텍스트 정리 - 여러 공백을 하나로
  const cleanText = text.replace(/\s+/g, " ").trim();

  // 문장 분리 (한국어와 영어 모두 고려)
  const sentences = cleanText
    .split(/(?<=[.!?다요음니까])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      // 의미 있는 문장만 필터링
      if (s.length < 15) return false;
      if (s.length > 200) return false;

      // 메뉴, 네비게이션 등 제외
      const skipPatterns = [
        /^(로그인|회원가입|검색|메뉴|홈|뒤로|다음|이전)/,
        /^(copyright|all rights|powered by)/i,
        /^\d+$/,
        /^[a-zA-Z]{1,3}$/,
      ];

      return !skipPatterns.some((pattern) => pattern.test(s));
    });

  // 중복 제거 및 상위 5개 반환
  const uniqueSentences = [...new Set(sentences)];
  return uniqueSentences.slice(0, 5);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
