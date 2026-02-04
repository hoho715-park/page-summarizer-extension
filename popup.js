document.getElementById("summarizeBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "getPageText" },
      (response) => {
        const fullText = response.text;

        const summary = summarizeText(fullText);

        document.getElementById("result").innerText = summary;
      },
    );
  });
});

function summarizeText(text) {
  if (!text) return "요약할 내용이 없습니다.";

  // 아주 간단한 요약: 앞부분 3문장만
  const sentences = text.split(".").slice(0, 3);
  return sentences.join(".") + ".";
}
