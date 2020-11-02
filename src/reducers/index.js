import * as actionTypes from '../actions/types'
import { combineReducers } from 'redux';

const initialUserState = {
    currentUser : {},
    isLoading : true
}
// user Reducer
const userReducer = (state = initialUserState, action) =>{
    switch (action.type) {
        case actionTypes.SET_USER:
            return {
                currentUser : action.payload.currentUser,
                isLoading : false
            }
        case actionTypes.CLEAR_USER:
            return {
                ...state,
                isLoading : false
            }
        default:
            return state;
    }
}
// channel reducer setCurrentChannel

const initialChannelState = {
    currentChannel: null,
    isPrivateChannel: false,
    userPosts: null
}

const channelReducer = (state = initialChannelState, action) =>{
    switch (action.type) {
        case actionTypes.SET_CURRENT_CHANNEL:
            return {
                ...state,
                currentChannel : action.payload.currentChannel
            }
        case actionTypes.SET_PRIVATE_CHANNEL:
            return {
                ...state,
                isPrivateChannel : action.payload.isPrivateChannel
            }
        case actionTypes.SET_USER_POSTS:
            return {
                ...state,
                userPosts : action.payload.userPosts
            }
        default:
            return state;
    }
}

const initialColorsState = {
    primaryColor: '#48164B',
    secondaryColor: '#222628'
}

const colorReducer = (state = initialColorsState, action) => {
    switch (action.type) {
        case actionTypes.SET_COLORS:
            return {
                ...state,
                primaryColor: action.payload.primaryColor,
                secondaryColor: action.payload.secondaryColor
            }
        default:
            return state;
    }
}

const rooteducer = combineReducers({
    user: userReducer,
    channel : channelReducer,
    colors: colorReducer
})

export default rooteducer;