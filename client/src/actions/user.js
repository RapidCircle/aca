import axios from 'axios';
import * as constants from '../constants.js';


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
    return axios.get('/_auth/info')
      .then(response => {
        if (response.status === 200) {
          return response.data
        }
        else {
          return logout();
        }
      })
      .then(data => dispatch(loggedin(data)))
      .catch(err => dispatch(logout()))
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