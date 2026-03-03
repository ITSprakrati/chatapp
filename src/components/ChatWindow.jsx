import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp,
  doc, setDoc, updateDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ChatWindow({ currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const chatId = getChatId(currentUser.uid, selectedUser.uid);
  const displayName = selectedUser.name || selectedUser.email;
  const displayAvatar = selectedUser.avatar || displayName[0].toUpperCase();
  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      msgs.forEach(msg => {
        if (msg.receiverId === currentUser.uid && !msg.seen) {
          updateDoc(doc(db, "chats", chatId, "messages", msg.id), { seen: true });
        }
      });
    });

    return () => unsub();
  }, [chatId, currentUser.uid]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);
  useEffect(() => {
    const typingRef = doc(db, "chats", chatId, "typing", selectedUser.uid);
    const unsub = onSnapshot(typingRef, snap => {
      setOtherTyping(snap.exists() ? snap.data().isTyping === true : false);
    });
    return () => unsub();
  }, [chatId, selectedUser.uid]);

  async function handleTyping(e) {
    setText(e.target.value);
    const typingRef = doc(db, "chats", chatId, "typing", currentUser.uid);
    await setDoc(typingRef, { isTyping: true });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(async () => {
      await setDoc(typingRef, { isTyping: false });
    }, 1500);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;

    const newMsg = text.trim();
    setText("");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMsg,
      senderId: currentUser.uid,
      receiverId: selectedUser.uid,
      timestamp: serverTimestamp(),
      seen: false
    });

    await setDoc(doc(db, "chats", chatId, "typing", currentUser.uid), { isTyping: false });
    clearTimeout(typingTimeout.current);
  }

  return (
    <div className="chat-window">

      {/* Header */}
      <div className="chat-header">
        <div className="avatar">{displayAvatar}</div>
        <div className="chat-header-info">
          <span className="chat-header-name">{displayName}</span>
          <span className="chat-header-status">
            {otherTyping ? "typing..." : "online"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="no-messages">
            Say hi to {displayName} 👋
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} className={`bubble-wrapper ${isOwn ? "own" : "other"}`}>
              <div className={`bubble ${isOwn ? "bubble-own" : "bubble-other"}`}>
                <p>{msg.text}</p>
                <div className="bubble-meta">
                  <span className="timestamp">{formatTime(msg.timestamp)}</span>
                  {isOwn && (
                    <span className="seen-tick" style={{ color: msg.seen ? "#53bdeb" : "#aaa" }}>
                      ✓✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="bubble-wrapper other">
            <div className="bubble bubble-other typing-bubble">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        {/* useRef: invisible div we scroll to */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="message-input" onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={handleTyping}
          onKeyDown={e => e.key === "Enter" && sendMessage(e)}
        />
        <button type="submit" disabled={!text.trim()}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
          </svg>
        </button>
      </form>
    </div>
  );
}