/* ================================================
   Firebase Configuration — Umang Creation
   ================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyAqJpw_7M0PgOGbJb2ubI-_D0cPrF6W2B0",
  authDomain: "umangcreation.firebaseapp.com",
  databaseURL: "https://umangcreation-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "umangcreation",
  storageBucket: "umangcreation.firebasestorage.app",
  messagingSenderId: "719890780021",
  appId: "1:719890780021:web:355ab3eebed26dc24acd3c"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// References
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
const database = firebase.database();
const projectsRef = database.ref('projects');
const assetsRef = database.ref('assets');
