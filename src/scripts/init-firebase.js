// // Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGOBf5W7oLezw3ZNQup2YWr480SmxG30g",
    authDomain: "graduate-16c74.firebaseapp.com",
    databaseURL: "https://graduate-16c74.firebaseio.com",
    projectId: "graduate-16c74",
    storageBucket: "graduate-16c74.appspot.com",
    messagingSenderId: "485788019711",
    appId: "1:485788019711:web:766682be75a5fb273b95ca"
  };

  // Initialize Firebase with a "default" Firebase project
  const defaultProject = firebase.initializeApp(firebaseConfig);
  
  // Option 1: Access Firebase services via the defaultProject variable
  const defaultDatabase = defaultProject.database();
  const auth = defaultProject.auth();
  
  export { defaultDatabase,  auth};