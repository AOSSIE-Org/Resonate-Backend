import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Add your Firebase Web App configuration here.
  // You will get this while creating a web app on firebase or in project settings if already created.
  apiKey: "AIzaSyBtqhCcL13MQCGHFXACdH-GSe5mFYt_F10",
  authDomain: "resonate-6cb08.firebaseapp.com",
  projectId: "resonate-6cb08",
  storageBucket: "resonate-6cb08.appspot.com",
  messagingSenderId: "976246452686",
  appId: "1:976246452686:web:fda0930d9d4fa3b6617b9f",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export { db };
