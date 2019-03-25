import axios from 'axios';
import * as constants from '../constants.js';
import {
  errorFetching
} from './default.js';

export const loadSites = data => dispatch => {
  dispatch({
    type: constants.LOAD_SHAREPOINTCONFIG,
    payload: data
  });
}

export function setActive(data) {
  return {
    type: constants.SET_SHAREPOINTCONFIG,
    payload: data
  };
}

export const loadArchive = data => dispatch => {
  dispatch({
    type: constants.LOAD_ARCHIVECONFIG,
    payload: data
  });
}

function getSharePointData() {
  return dispatch => {
    return axios.get('/_api/setup/sharepoint')
      .then(response => dispatch(loadSites(response.data)))
      .catch(err => dispatch(errorFetching(err)))
  }
}

function getArchiveData() {
  return dispatch => {
    return axios.get('/_api/setup/archive')
      .then(response => dispatch(loadSites(response.data)))
      .catch(err => dispatch(errorFetching(err)))
  }
}

export function fetchSharepoint() {

  return (dispatch, getState) => {
    dispatch({
      type: constants.FETCH_SHAREPOINTCONFIG
    });
    return dispatch(getSharePointData());
  }
}

export function setSharepoint(data) {

  return (dispatch) => {    
    return axios.post('/_api/setup/sharepoint', { siteId: data })
      .then(response => dispatch(setActive(response.data)))
      .catch(err => dispatch(errorFetching(err)))    
  }
}

export function fetchArchive() {

  return (dispatch, getState) => {
    dispatch({
      type: constants.FETCH_ARCHIVECONFIG
    });
    return dispatch(getArchiveData());
  }
}