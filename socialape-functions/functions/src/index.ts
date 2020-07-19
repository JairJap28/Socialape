import * as express from "express";
import * as functions from 'firebase-functions';
import * as firebase from 'firebase';
import { firebaseConfig } from './util/firebaseConfig';
import {
    getAllScreams,
    postOneScream,
    getScream,
    likeScream,
    unlikeScream,
    commentOnScreen,
    deleteScream
} from './handlers/screams';
import {
    signUp,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
} from './handlers/users';
import { FBAuth } from './util/fbAuth';
import { db } from './util/admin';

const app = express();
firebase.initializeApp(firebaseConfig);

// Scream route
app.get('/screams', getAllScreams);
app.post('/screams', FBAuth, postOneScream);
app.get('/screams/:screamId', getScream);
app.delete('/screams/:screamId', FBAuth, deleteScream);
app.get('/screams/:screamId/like', FBAuth, likeScream);
app.get('/screams/:screamId/unlike', FBAuth, unlikeScream);
app.post('/screams/:screamId/comment', FBAuth, commentOnScreen);

// Users route
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore.document('likes/{id}').onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then((doc: any) => {
            if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: doc.id
                });
            } else return;
        }).catch(err => {
            console.error(err);
        });
});

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}').onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`).delete()
        .catch(err => {
            console.error(err);
            return;
        });
});

exports.createNotificationOnComment = functions.firestore.document('comments/{id}').onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then((doc: any) => {
            if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createAt: new Date().toISOString(),
                    recipient: doc.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: doc.id
                });
            } else return;
        }).catch(err => console.error(err));
});

exports.onUserImageChange = functions.firestore.document('/users/{id}').onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
        let batch = db.batch();
        return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
            .then(data => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`);
                    batch.update(scream, { userImage: change.after.data().imageUrl });
                });
                return batch.commit();
            });
    } else {
        return true;
    }
});

exports.onScreamDeleted = functions.firestore.document('screams/{id}').onDelete((snapshot, context) => {
    const screamId = context.params.id;
    const batch = db.batch();

    return db.collection('comments').where('screamId', '==', screamId).get()
        .then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/comments/${doc.id}`));
            });
            return db.collection('likes').where('screamId', '==', screamId).get();
        }).then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/likes/${doc.id}`));
            });
            return db.collection('notifications').where('screamId', '==', screamId).get();
        }).then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/notifications/${doc.id}`));
            });
            return batch.commit();
        }).catch(err => {
            console.error(err);
        });
});