import {
    SET_SCREAMS,
    SET_SCREAM,
    LIKE_SCREAM,
    UNLIKE_SCREAM,
    LOADING_DATA,
    DELETE_SCREAM,
    POST_SCREAM,
    SUBMIT_COMMENT
} from '../types';
import produce from 'immer';

const initialState = {
    screams: [],
    scream: {},
    loading: false
};

export default function(state = initialState, action) {
    switch (action.type) {
        case LOADING_DATA:
            return {
                ...state,
                loading: true
            };    
        case SET_SCREAMS: 
            return {
                ...state,
                screams: action.payload,
                loading: false
            };
        case SET_SCREAM:
            return {
                ...state,
                scream: action.payload
            };
        case LIKE_SCREAM:
        case UNLIKE_SCREAM:
            let indexToUnlike = state.screams.findIndex((scream) => scream.screamId === action.payload.screamId);
            state.screams[indexToUnlike] = action.payload;
            if (state.scream.screamId === action.payload.screamId) {
                let comments = state.scream.comments;
                state.scream = action.payload;
                state.scream.comments = comments;
            }
            return {
                ...state
            };
        case DELETE_SCREAM:
            let indexToDelete = state.screams.findIndex((scream) => scream.screamId === action.payload.screamId);
            state.screams.splice(indexToDelete, 1);
            return {
                ...state
            };
        case POST_SCREAM:
            return {
                ...state,
                screams: [
                    action.payload,
                    ...state.screams 
                ]
            };
        case SUBMIT_COMMENT:
            let indexScreamCommented = state.screams.findIndex((scream) => scream.screamId === action.payload.screamId);
            let cantidadLikes = state.scream.commentCount + 1;
            
            let editedScream = produce(state.screams[indexScreamCommented], draftState => {
                draftState.commentCount++
            });
            
            state.screams[indexScreamCommented] = editedScream

            state.scream = {
                ...state.scream,
                commentCount: cantidadLikes,
                comments: [action.payload, ...state.scream.comments]
            };
            return {
                ...state
            };
        default:
            return state;
    }
}