import React from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

function TestFirestore() {
  const testFirestore = async () => {
    try {
      const docRef = await addDoc(collection(db, "test"), {
        message: "This is a test document",
        timestamp: new Date()
      });
      console.log("Document written with ID: ", docRef.id);
      alert("Test successful! Document ID: " + docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error: " + e.message);
    }
  };

  return (
    <div>
      <button onClick={testFirestore}>Test Firestore Connection</button>
    </div>
  );
}

export default TestFirestore;