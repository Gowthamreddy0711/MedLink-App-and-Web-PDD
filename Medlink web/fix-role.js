import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2YF8G6yAsXGVhXE-q-XocUVeOA6vWg-8",
  authDomain: "medlink-android-app.firebaseapp.com",
  projectId: "medlink-android-app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

(async () => {
    try {
        console.log('Logging in...');
        const userCred = await signInWithEmailAndPassword(auth, 'admin@gmail.com', 'Gowtham@0826');
        console.log('Logged in as:', userCred.user.uid);
        
        console.log('Updating document...');
        await updateDoc(doc(db, "users", userCred.user.uid), {
            role: "ADMIN ", // Note the trailing space to PROVE the fix works
            approvalStatus: "APPROVED"
        });
        console.log('Document updated!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
