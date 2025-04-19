// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJq7IXAOZEaITJVQrOXH6hOk9vAHCYdwo",
  authDomain: "codetogether-bf7e1.firebaseapp.com",
  projectId: "codetogether-bf7e1",
  storageBucket: "codetogether-bf7e1.appspot.com",
  messagingSenderId: "621583802793",
  appId: "1:621583802793:web:43de1b427150ee02f024b8"
};

// Initialize Firebase
console.log("Initializing Firebase with project:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 