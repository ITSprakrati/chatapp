import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";

const DEMO_USERS = [
  { uid: "demo_1", name: "Aarav Sharma", email: "aarav@demo.com", avatar: "A" },
  { uid: "demo_2", name: "Priya Verma",  email: "priya@demo.com", avatar: "P" },
  { uid: "demo_3", name: "Rahul Mehta",  email: "rahul@demo.com", avatar: "R" },
  { uid: "demo_4", name: "Sneha Iyer",   email: "sneha@demo.com", avatar: "S" },
];

export default function ChatList({ currentUser, onSelectUser, selectedUser }) {
  const [realUsers, setRealUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snapshot => {
      const list = snapshot.docs
        .map(doc => doc.data())
        .filter(u => u.uid !== currentUser.uid);
      setRealUsers(list);
    });
    return () => unsub();
  }, [currentUser.uid]);

  // merge real users + demo users, remove duplicates by uid
  const allUsers = [
    ...DEMO_USERS,
    ...realUsers.filter(u => !DEMO_USERS.find(d => d.uid === u.uid))
  ];

  const filtered = allUsers.filter(u =>
    (u.name || u.email).toLowerCase().includes(search.toLowerCase())
  );

  const displayName = u => u.name || u.email;
  const displayAvatar = u => u.avatar || (u.name || u.email)[0].toUpperCase();

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <div className="chat-list-header-top">
          <div className="current-user-info">
            <div className="avatar avatar-green">
              {currentUser.email[0].toUpperCase()}
            </div>
            <span className="current-user-email">{currentUser.email}</span>
          </div>
          <button className="signout-btn" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="Search or start new chat"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="user-list">
        {filtered.map(user => (
          <div
            key={user.uid}
            className={`user-item ${selectedUser?.uid === user.uid ? "active" : ""}`}
            onClick={() => onSelectUser(user)}
          >
            <div className="avatar">{displayAvatar(user)}</div>
            <div className="user-item-info">
              <span className="user-item-name">{displayName(user)}</span>
              <span className="user-item-sub">Tap to chat</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
