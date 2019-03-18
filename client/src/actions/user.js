import fetch from 'cross-fetch';
import * as constants from '../constants.js';
import createDebugger from 'debug';
const debug = createDebugger('actions:user');

export const startlogin = data => dispatch => {
  dispatch({
    type: constants.USER_LOGGING_IN
  })
}

export const loggedin = data => {
  return {
    type: constants.USER_LOGGED_IN,
    payload: data
  };
}

function getApiData() {
  return dispatch => {
    return fetch('http://localhost:3000/_auth/info', {credentials:"same-origin"})
      .then(response => {
        if (response.status === 200) {
          return response.json()
        }
        else {
          throw new Error(`Bad response from server. ({response.status})`);
        }
      })
      .then(data => dispatch(loggedin(data)))
      .catch(err => debug(err))
  }
}

export function checklogin() {
  return (dispatch, getState) => {
    return dispatch(getApiData());
  }
}

export function logout() {
  return {
    type: constants.USER_LOGGED_OUT
  }
}