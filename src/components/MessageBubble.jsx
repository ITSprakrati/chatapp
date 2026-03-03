export default function MessageBubble({ message, isOwn }) {
  const time = message.timestamp?.toDate
    ? message.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <div className={`bubble-wrapper ${isOwn ? "own" : "other"}`}>
      <div className={`bubble ${isOwn ? "bubble-own" : "bubble-other"}`}>
        <p>{message.text}</p>
        <div className="bubble-meta">
          <span className="timestamp">{time}</span>
          {isOwn && <span className="seen">{message.seen ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}