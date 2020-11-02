import * as firebase from 'firebase'

import "firebase/auth";
import "firebase/database";
import "firebase/storage";

const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyBq6pHcjldF7GZATUtuLAiZpR_husn9Pgg",
    authDomain: "slackclone-v1.firebaseapp.com",
    databaseURL: "https://slackclone-v1.firebaseio.com",
    projectId: "slackclone-v1",
    storageBucket: "slackclone-v1.appspot.com",
    messagingSenderId: "29364106551",
    appId: "1:29364106551:web:a98d1caf63a16b1b0556b2"
});
// Initialize Firebase
// firebase.initializeApp(firebaseConfig);
//   if (!firebase.apps.length) {
//     firebase.initializeApp(config);
//  }
 const DB = firebaseApp.database();
 const Auth = firebaseApp.auth();
 const Storage = firebaseApp.storage();

 export {DB, Auth, Storage, firebase};