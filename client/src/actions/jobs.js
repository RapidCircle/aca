import axios from 'axios';
import * as constants from '../constants.js';
import { errorFetching } from './default.js';

export const loadJobs = data => dispatch => {
  dispatch({
    type: constants.LOAD_JOBS,
    payload: data
  });
}

function getApiData() {
  return dispatch => {
    return axios.get('/_api/jobs')
      .then(response => dispatch(loadJobs(response.data)))
      .catch(err => dispatch(errorFetching(err)))
  }
}

export function fetchJobs() {    

  return (dispatch, getState) => {
    dispatch({
    type: constants.FETCH_JOBS
    });
    return dispatch(getApiData());
  }
}