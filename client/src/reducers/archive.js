import {
  FETCH_ARCHIVECONFIG,
  LOAD_ARCHIVECONFIG,
  SET_ARCHIVECONFIG
} from '../constants';

const initialState = {}

export default function jobState(state = initialState, {
  type,
  payload
}) {
  switch (type) {
    case FETCH_ARCHIVECONFIG:
      return {
        ...initialState
      }
    case LOAD_ARCHIVECONFIG:
      return payload
    default:
      return state
  }
}