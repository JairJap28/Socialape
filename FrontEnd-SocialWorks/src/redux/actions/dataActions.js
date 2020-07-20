import {
    SET_SCREAMS,
    LOADING_DATA,
    LIKE_SCREAM,
    UNLIKE_SCREAM,
    DELETE_SCREAM
} from '../types';
import axios from 'axios';

// Get all screams
export const getScreams = () => (dispatch) => {
    dispatch({ type: LOADING_DATA });
    axios.get('/screams').then(res => {
        dispatch({
            type: SET_SCREAMS,
            payload: res.data
        });
    }).catch(err => {
        dispatch({
            type: SET_SCREAMS,
            payload: []
        });
    });
};

// Like a scream
export const likeScream = (screamId) => (dispatch) => {
    axios.get(`/screams/${screamId}/like`).then(res => {
        dispatch({
            type: LIKE_SCREAM,
            payload: res.data
        });
    }).catch(err => console.log(err));
};

// Unlike a scream
export const unlikeScream = (screamId) => (dispatch) => {
    axios.get(`/screams/${screamId}/unlike`).then(res => {
        console.log(res);
        dispatch({
            type: UNLIKE_SCREAM,
            payload: res.data
        });
    }).catch(err => console.log(err));
};

// Delete scream
export const deleteScream = (screamId) => (dispatch) => {
    axios.delete(`/screams/${screamId}`).then(res => {
        dispatch({
            type: DELETE_SCREAM,
            payload: { screamId: screamId }
        });
    }).catch(err => console.log(err));
};