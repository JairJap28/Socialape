import * as firebase from 'firebase';
import admin, { db } from '../util/admin';
import { firebaseConfig } from '../util/firebaseConfig';
import { validateSignUpData, validateLoginData, reduceUserDetails } from '../util/validators';
import * as BusBoy from 'busboy';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Sign users up
export const signUp = (req: any, res: any) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    const { valid, errors } = validateSignUpData(newUser);
    if (!valid) return res.status(400).json(errors);

    const noImage = 'blank-profile-picture.png';

    let token: string | undefined;
    let userId: string | undefined;
    return db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'This handle is already taken' });
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
                    .then(data => {
                        userId = data.user?.uid;
                        return data.user?.getIdToken();
                    })
                    .then((idToken) => {
                        token = idToken;
                        const userCredentials = {
                            handle: newUser.handle,
                            email: newUser.email,
                            createAt: new Date().toISOString(),
                            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImage}?alt=media`,
                            userId
                        };
                        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
                    })
                    .then(() => {
                        return res.status(201).json({ token });
                    })
                    .catch(err => {
                        console.error(err);
                        if (err.code === 'auth/email-already-in-use') {
                            return res.status(400).json({ email: 'Email is already in use' });
                        } else {
                            return res.status(500).json({ general: 'Something went wrong try again' });
                        }
                    });
            }
        })
};

// Log user in
export const login = (req: any, res: any) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(user);
    if (!valid) return res.status(400).json(errors);

    return firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user?.getIdToken();
        })
        .then(idToken => {
            return res.status(200).json({ token: idToken });
        })
        .catch(err => {
            console.error(err.code);
            if (err.code === 'auth/wrong-password') {
                return res.status(403).json({ general: 'Wrong credentials, please try again' });
            } else if (err.code === 'auth/user-not-found') {
                return res.status(403).json({ general: 'User not found, please write a correct one' });
            }
            return res.status(500).json({ error: err.code });
        });

};

// Add user details
export const addUserDetails = (req: any, res: any) => {
    let userDetails = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.handle}`)
        .update(userDetails)
        .then(() => {
            res.json({ message: 'Details added successfully' });
        })
        .catch(err => {
            console.error(err);
            res.status(404).json({ error: err.code });
        });
}

// Get own user details
export const getAuthenticatedUser = (req: any, res: any) => {
    let userData: any = {};

    db.doc(`/users/${req.user.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', req.user.handle).get();
            } else {
                return res.status(500).json({ error: "User doesn't exist" });
            }
        })
        .then(data => {
            userData.likes = [];
            data?.forEach((doc: any) => {
                userData.likes.push(doc.data());
            });
            return db.collection('notifications').where('recipient', '==', req.user.handle)
                .orderBy('createAt', 'desc').limit(10).get();
        }).then((data) => {
            userData.notifications = [];
            data.forEach(doc => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createAt: doc.data().createAt,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id
                });
            });
            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
}

// Get any user's details
export const getUserDetails = (req: any, res: any) => {
    let userData: any = {};
    db.doc(`/users/${req.params.handle}`).get().then(doc => {
        if (doc.exists) {
            userData.user = doc.data();
            return db.collection('screams').where('userHandle', '==', req.params.handle)
                .orderBy('createAt', 'desc').get();
        } else {
            return res.status(500).json({ error: 'User not found' });
        };
    }).then(data => {
        userData.screams = [];
        data?.forEach((doc: any) => {
            userData.screams.push({
                body: doc.data().body,
                createAt: doc.data().createAt,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                screamId: doc.id
            });
        });

        return res.json(userData);
    }).catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
    });
}

// Upload profile image
export const uploadImage = (req: any, res: any) => {
    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName: any;
    let imageToBeUploaded: any = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type submitted' });
        }

        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };

        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                contentType: imageToBeUploaded.mimetype
            }
        }).then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl: imageUrl });
        }).then(() => {
            return res.json({ message: 'Image uploaded successfully' });
        }).catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
    });

    busboy.end(req.rawBody);
};

// Mark notifications as read
export const markNotificationsRead = (req: any, res: any) => {
    let batch = db.batch();
    req.body.forEach((notificationId: any) => {
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, { read: true });
    })

    batch.commit().then(() => {
        return res.json({ message: 'Notifications marked read' });
    }).catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    });
}