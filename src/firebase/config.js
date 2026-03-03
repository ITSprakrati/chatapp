import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDruwP8VPHMjof-Hm9tnCeDBjEcv3udB-I",
  authDomain: "my-chat-app-85ab2.firebaseapp.com",
  projectId: "my-chat-app-85ab2",
  storageBucket: "my-chat-app-85ab2.firebasestorage.app",
  messagingSenderId: "617342607784",
  appId: "1:617342607784:web:708b78c79402eda69cfd9d"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);