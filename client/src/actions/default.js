import * as constants from '../constants.js';

export function errorFetching(err) {
  return {
    type: constants.ERROR_FETCHING,
    payload: err
  }
}