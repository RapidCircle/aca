import { combineReducers } from 'redux';
import error from './default.js';
import auth from './auth.js';
import user from './user.js';
import jobs from './jobs.js';
import sharepoint from './sharepoint.js';

export default combineReducers({
  error: error,
  selectMe: auth,
  user: user,
  jobs: jobs,
  sharepoint: sharepoint
})