// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyD6-_xYfAxXH3fe4RsED6v-zrTvwivVUl0",
    authDomain: "medi-mart-bd.firebaseapp.com",
    projectId: "medi-mart-bd",
    storageBucket: "medi-mart-bd.firebasestorage.app",
    messagingSenderId: "1096585525228",
    appId: "1:1096585525228:web:1aa7a87eb9599f0e6132c9"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192.png',
        data: payload.data,
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});