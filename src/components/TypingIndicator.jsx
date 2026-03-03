export default function TypingIndicator({ isTyping }) {
  if (!isTyping) return null;
  return (
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}