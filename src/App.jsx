import { useState, useEffect, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase/config";

const DEMO_USERS = [
  { uid: "demo_1", name: "Aarav Sharma",  email: "aarav@demo.com"  },
  { uid: "demo_2", name: "Priya Verma",   email: "priya@demo.com"  },
  { uid: "demo_3", name: "Rahul Mehta",   email: "rahul@demo.com"  },
  { uid: "demo_4", name: "Sneha Iyer",    email: "sneha@demo.com"  },
];

const initials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const COLORS = ["#e53935","#d81b60","#8e24aa","#5e35b1","#3949ab","#1e88e5","#039be5","#00897b","#43a047","#f4511e"];
const avatarColor = (str = "") => COLORS[(str.charCodeAt(0) || 0) % COLORS.length];

const fmt = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getChatId = (a, b) => [a, b].sort().join("_");
function AuthScreen({ onAuth }) {
  const [mode, setMode]     = useState("login");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setErr("Please enter your name"); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name.trim() });
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid, name: name.trim(), email, createdAt: serverTimestamp(),
        });
        onAuth(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        onAuth(cred.user);
      }
    } catch (e) {
      setErr(e.message.replace("Firebase: ", "").replace(/ \(.*\)/, ""));
    }
    setLoading(false);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f0f2f5",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "44px 40px",
        width: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{ fontSize: 38, marginBottom: 6 }}>💬</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111b21", marginBottom: 4 }}>ChatApp</div>
        <div style={{ fontSize: 13, color: "#667781", marginBottom: 32 }}>
          {mode === "login" ? "Sign in to continue" : "Create your account"}
        </div>

        {mode === "signup" && (
          <input
            style={iStyle}
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input
          style={iStyle}
          placeholder="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={iStyle}
          placeholder="Password"
          type="password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />

        {err && (
          <div style={{ color: "#f15c6d", fontSize: 12, marginBottom: 12, alignSelf: "flex-start" }}>
            {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%", padding: "13px", borderRadius: 8, border: "none",
            background: "#00a884", color: "#fff", fontWeight: 700,
            fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, marginBottom: 16,
          }}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div style={{ fontSize: 13, color: "#667781" }}>
          {mode === "login"
            ? <>No account?{" "}<span onClick={() => { setMode("signup"); setErr(""); }} style={linkStyle}>Sign Up</span></>
            : <>Already have an account?{" "}<span onClick={() => { setMode("login"); setErr(""); }} style={linkStyle}>Sign In</span></>
          }
        </div>
      </div>
    </div>
  );
}

const iStyle = {
  width: "100%", padding: "12px 14px", marginBottom: 14,
  border: "1.5px solid #e9edef", borderRadius: 8,
  fontSize: 14, outline: "none", color: "#111b21",
  background: "#f0f2f5", boxSizing: "border-box",
};

const linkStyle = { color: "#00a884", cursor: "pointer", fontWeight: 600 };
function TypingDots() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}>
      <div style={{
        background: "#fff", borderRadius: "4px 18px 18px 18px",
        padding: "12px 16px", display: "inline-flex", gap: 5,
        alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}>
        {["0s", ".2s", ".4s"].map((d, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#667781",
            animation: "wabounce 1.2s infinite", animationDelay: d,
          }} />
        ))}
      </div>
    </div>
  );
}
export default function App() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [realUsers, setRealUsers]     = useState([]);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState("");
  const [theyTyping, setTheyTyping]   = useState(false);

  const bottomRef   = useRef(null);   
  const typingTimer = useRef(null);   
  const unsubMsg    = useRef(null);
  const unsubTyp    = useRef(null);
  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
  }, []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), snap => {
      setRealUsers(snap.docs.map(d => d.data()).filter(u2 => u2.uid !== user.uid));
    });
  }, [user]);
  useEffect(() => {
    if (unsubMsg.current) unsubMsg.current();
    if (unsubTyp.current) unsubTyp.current();
    setMessages([]);
    setTheyTyping(false);
    if (!user || !selected) return;

    const cid = getChatId(user.uid, selected.uid);
    const q = query(collection(db, "chats", cid, "messages"), orderBy("createdAt"));
    unsubMsg.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    if (!selected.uid.startsWith("demo_")) {
      unsubTyp.current = onSnapshot(
        doc(db, "chats", cid, "typing", selected.uid),
        snap => setTheyTyping(snap.exists() && snap.data()?.typing === true)
      );
    }
  }, [selected, user]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, theyTyping]);

  const handleTyping = (val) => {
    setText(val);
    if (!user || !selected || selected.uid.startsWith("demo_")) return;
    const cid = getChatId(user.uid, selected.uid);
    setDoc(doc(db, "chats", cid, "typing", user.uid), { typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() =>
      setDoc(doc(db, "chats", cid, "typing", user.uid), { typing: false }), 1500
    );
  };

  const send = async () => {
    if (!text.trim() || !user || !selected) return;
    const msg = text.trim();
    setText("");
    const cid = getChatId(user.uid, selected.uid);
    await addDoc(collection(db, "chats", cid, "messages"), {
      text: msg, uid: user.uid, createdAt: serverTimestamp(),
    });
    if (!selected.uid.startsWith("demo_")) {
      await setDoc(doc(db, "chats", cid, "typing", user.uid), { typing: false });
    }
  };

  const allUsers = [
    ...DEMO_USERS,
    ...realUsers.filter(u => !DEMO_USERS.find(d => d.uid === u.uid)),
  ];
  const filtered = allUsers.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5", color: "#667781", fontSize: 15 }}>
      Loading…
    </div>
  );

  if (!user) return <AuthScreen onAuth={setUser} />;

  const myName = user.displayName || user.email;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, #root { height: 100vh; width: 100vw; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        input::placeholder, textarea::placeholder { color: #8696a0; }
        @keyframes wabounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
      `}</style>

      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>

        {/* ════ SIDEBAR ════ */}
        <div style={{
          width: 380, minWidth: 300, maxWidth: 420,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid #e9edef", background: "#fff",
          height: "100vh", flexShrink: 0,
        }}>

          {/* Sidebar header */}
          <div style={{
            background: "#f0f2f5", padding: "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid #e9edef", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: avatarColor(myName), color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 15, flexShrink: 0,
              }}>
                {initials(myName)}
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#111b21" }}>
                {myName}
              </span>
            </div>
            <button onClick={() => signOut(auth)} style={{
              background: "none", border: "none", color: "#54656f",
              fontSize: 12, cursor: "pointer", padding: "4px 8px",
              borderRadius: 6, fontWeight: 500,
            }}>
              Sign out
            </button>
          </div>

          {/* Search bar */}
          <div style={{ padding: "8px 12px", background: "#f0f2f5", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#fff", borderRadius: 8, padding: "6px 12px",
              border: "1px solid #e9edef",
            }}>
              <span style={{ color: "#54656f", fontSize: 15 }}>🔍</span>
              <input
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 14, color: "#111b21", background: "transparent",
                }}
                placeholder="Search or start new chat"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Contact list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map(u => {
              const isActive = selected?.uid === u.uid;
              return (
                <div
                  key={u.uid}
                  onClick={() => setSelected(u)}
                  style={{
                    display: "flex", alignItems: "center", gap: 13,
                    padding: "10px 16px", cursor: "pointer",
                    background: isActive ? "#f0f2f5" : "#fff",
                    borderBottom: "1px solid #f0f2f5",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f5f6f6"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fff"; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: avatarColor(u.name), color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 17, flexShrink: 0,
                  }}>
                    {initials(u.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#111b21" }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: "#667781", marginTop: 2 }}>Tap to chat</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════ RIGHT SIDE ════ */}
        {!selected ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#f0f2f5", gap: 14,
            borderLeft: "1px solid #e9edef",
          }}>
            <div style={{ fontSize: 64 }}>💬</div>
            <div style={{ fontSize: 26, fontWeight: 300, color: "#111b21" }}>WhatsApp Web</div>
            <div style={{ fontSize: 14, color: "#667781", maxWidth: 320, textAlign: "center" }}>
              Send and receive messages. Select a contact from the left to get started.
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>

            {/* Chat header */}
            <div style={{
              background: "#f0f2f5", padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 13,
              borderBottom: "1px solid #e9edef", flexShrink: 0,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: avatarColor(selected.name), color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                {initials(selected.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#111b21" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "#667781" }}>
                  {theyTyping ? "typing…" : "online"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "12px 60px",
              background: "#efeae2",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
            }}>
              {messages.length === 0 && (
                <div style={{
                  textAlign: "center", marginTop: 40,
                  color: "#667781", fontSize: 13,
                }}>
                  <span style={{
                    background: "rgba(255,255,255,0.85)", padding: "6px 16px",
                    borderRadius: 8, display: "inline-block",
                  }}>
                    Say hi to {selected.name} 👋
                  </span>
                </div>
              )}

              {messages.map(m => {
                const mine = m.uid === user.uid;
                return (
                  <div key={m.id} style={{
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                    marginBottom: 4,
                  }}>
                    <div style={{
                      maxWidth: "65%", padding: "7px 12px 4px 12px",
                      borderRadius: mine ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                      background: mine ? "#d9fdd3" : "#fff",
                      fontSize: 14, lineHeight: 1.5,
                      color: "#111b21", wordBreak: "break-word",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.10)",
                    }}>
                      {m.text}
                      <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "flex-end", gap: 3, marginTop: 2,
                      }}>
                        <span style={{ fontSize: 11, color: "#667781" }}>{fmt(m.createdAt)}</span>
                        {mine && <span style={{ fontSize: 13, color: "#53bdeb" }}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {theyTyping && <TypingDots />}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{
              background: "#f0f2f5", padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 10,
              borderTop: "1px solid #e9edef", flexShrink: 0,
            }}>
              <textarea
                rows={1}
                placeholder="Type a message"
                value={text}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 24,
                  border: "none", background: "#fff", color: "#111b21",
                  fontSize: 15, outline: "none", resize: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={send}
                style={{
                  width: 46, height: 46, borderRadius: "50%", border: "none",
                  background: text.trim() ? "#00a884" : "#d1d7db",
                  color: "#fff", cursor: text.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.2s",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12L22 2L15 22L11 13L2 12Z" fill="white" />
                </svg>
              </button>
            </div>

          </div>
        )}
      </div>
    </>
  );
}