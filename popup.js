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
      func: () => document.body.innerText,
    });

    const text = results[0]?.result;

    if (!text) {
      resultEl.innerText = "페이지 내용을 가져오지 못했습니다.";
      resultEl.classList.add("empty-state");
    } else {
      const summary = summarizeText(text);
      resultEl.innerText = summary;
      resultEl.classList.remove("empty-state");
    }
  } catch (error) {
    console.error("오류:", error);
    resultEl.innerText =
      "페이지를 요약할 수 없습니다. (chrome:// 페이지 등은 지원되지 않습니다)";
    resultEl.classList.add("empty-state");
  } finally {
    loadingEl.style.display = "none";
    resultEl.style.display = "block";
  }
});

function summarizeText(text) {
  if (!text || text.trim().length === 0) return "요약할 내용이 없습니다.";

  // 텍스트 정리
  const cleanText = text.replace(/\s+/g, " ").trim();

  // 문장 단위로 분리
  const sentences = cleanText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length === 0) return "요약할 내용이 없습니다.";

  // 처음 3문장 반환
  const summary = sentences.slice(0, 3).join(". ");
  return summary + ".";
}
