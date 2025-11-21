// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4WVraBbIFYAnqa63xPgxgDRwKar99tdQ",
  authDomain: "planer-test-40ee1.firebaseapp.com",
  projectId: "planer-test-40ee1",
  storageBucket: "planer-test-40ee1.firebasestorage.app",
  messagingSenderId: "68109418592",
  appId: "1:68109418592:web:b072d11b1f80a97fd9c305",
  measurementId: "G-YJJNFTVN1Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);