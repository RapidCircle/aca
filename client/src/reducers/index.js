import { combineReducers } from 'redux'
import auth from './auth.js'
import user from './user.js';

export default combineReducers({
  selectMe: auth,
  user: user
})