export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakWord(word: string): void {
  if (!canSpeak() || !word.trim()) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
