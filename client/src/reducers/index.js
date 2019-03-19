import { combineReducers } from 'redux'
import auth from './auth.js'
import user from './user.js';
import jobs from './jobs.js';

export default combineReducers({
  selectMe: auth,
  user: user,
  jobs: jobs
})