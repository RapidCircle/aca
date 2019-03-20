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

export const loggedout = data => {
  return {
    type: constants.USER_LOGGED_OUT
  }
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

function logoutApi() {
  return dispatch => {
    return axios.get('/_auth/signout')
      .then(response => {
        if (response.status === 200) {
          return response.data
        } else {
          return logout();
        }
      })
      .then(data => dispatch(loggedout()))
      .catch(err => dispatch(loggedout()))
  }
}

export function checklogin() {
  return (dispatch, getState) => {
    return dispatch(getApiData());
  }
}

export function logout() {
  return (dispatch, getState) => {
    return dispatch(logoutApi());
  }  
}