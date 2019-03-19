import axios from 'axios';
import * as constants from '../constants.js';
import { errorFetching } from './default.js';

export const loadResources = data => dispatch => {
  dispatch({
    type: constants.FETCH_RESOURCES,
    payload: data
  });
}

function getApiData() {
  return dispatch => {
    return axios.get('/_api/resources')
      .then(response => dispatch(loadResources(response.data)))
      .catch(err => dispatch(errorFetching(err)))
  }
}

export function fetchResources() {
  return (dispatch, getState) => {
    return dispatch(getApiData());
  }
}