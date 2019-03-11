import * as constants from '../constants.js';

export const login = data => dispatch => {  
  dispatch({
    type: constants.USER_LOGGED_IN,
    payload: data
  });
}

export function logout() {
  return {
    type: constants.USER_LOGGED_OUT
  }
}