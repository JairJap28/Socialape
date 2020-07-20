import { db } from '../util/admin';

export const getAllScreams = (req: any, res: any) => {
    db.collection('screams')
        .orderBy('createAt', 'desc')
        .get()
        .then(data => {
            let screams: any[] = [];
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createAt,
                    userImage: doc.data().userImage,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount
                });
            });
            return res.json(screams);
        })
        .catch(err => console.error(err));
};

export const postOneScream = (req: any, res: any) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    db.collection('screams')
        .add(newScream)
        .then(doc => {
            const resScream: any = newScream;
            resScream.screamId = doc.id;
            res.json(resScream);
        })
        .catch(err => {
            res.status(500).json({ error: 'Something went wrong' });
            console.error(err);
        });
};

// Fetch any scream
export const getScream = (req: any, res: any) => {
    let screamData: any = {};

    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' });
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db.collection('comments')
                .orderBy('createAt', 'desc')
                .where('screamId', '==', req.params.screamId).get();
        })
        .then(data => {
            screamData.comments = [];
            data.forEach((doc: any) => {
                screamData.comments.push(doc.data());
            });
            return res.json(screamData);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
};

// Comment on a scream
export const commentOnScreen = (req: any, res: any) => {
    if (req.body.body.trim() === '') return res.status(400).json({ comment: 'Must not be empty' });

    const newComment: any = {
        body: req.body.body,
        createAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' });
            }
            let document: any = doc.data();
            return doc.ref.update({ commentCount: document.commentCount + 1 });
        })
        .then(() => {
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            return res.json(newComment);
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        });
};

// Like a scream
export const likeScream = (req: any, res: any) => {
    const likeDocument = db.collection('likes').where('userHandle', "==", req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData: any = {};

    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Scream not found' });
            }
        })
        .then(data => {
            if (data.empty) {
                return db.collection('likes').add({
                    screamId: req.params.screamId,
                    userHandle: req.user.handle
                }).then(() => {
                    screamData.likeCount++;
                    return screamDocument.update({ likeCount: screamData.likeCount });
                }).then(() => {
                    return res.json(screamData);
                })
            } else {
                return res.status(400).json({ error: 'Scream already liked' })
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// Unlike scream
export const unlikeScream = (req: any, res: any) => {
    const likeDocument = db.collection('likes').where('userHandle', "==", req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData: any = {};

    screamDocument.get()
        .then(doc => {
            if (doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Scream not found' });
            }
        })
        .then(data => {
            if (data.empty) {
                return res.status(400).json({ error: 'Scream not liked' });
            } else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    }).then(() => {
                        res.json(screamData);
                    });
            }
        }).catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// Delete scream 
export const deleteScream = (req: any, res: any) => {
    const document = db.doc(`/screams/${req.params.screamId}`);
    document.get().then((doc: any) => {
        if (!doc.exists) {
            return res.status(404).json({ error: 'Scream not found' });
        }

        if (doc.data().userHandle !== req.user.handle) {
            return res.status(403).json({ error: 'Unauthorized' });
        } else {
            return document.delete();
        }
    }).then(() => {
        res.json({ message: 'Scream deleted successfully' });
    }).catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    });
}