import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBkhwZMpfLzXxLovi1L_-lhJCdJM2Rwdt4",
    authDomain: "sudoku-5c3a3.firebaseapp.com",
    projectId: "sudoku-5c3a3",
    storageBucket: "sudoku-5c3a3.firebasestorage.app",
    messagingSenderId: "377907321708",
    appId: "1:377907321708:web:1e3156a88ef310a531b149"
};

// Initialize Firebase only if it hasn't been initialized yet
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    console.warn("Persistence error:", err);
});

export { db, firebase };