import {
  FETCH_SHAREPOINTCONFIG,
  LOAD_SHAREPOINTCONFIG,
  SET_SHAREPOINTCONFIG
} from '../constants';

const initialState = {
}

export default function spState(state = initialState, { type, payload }) {
  switch (type) {
    case FETCH_SHAREPOINTCONFIG:
      return { ...initialState }
    case LOAD_SHAREPOINTCONFIG:
      return payload
    case SET_SHAREPOINTCONFIG:
      return { ...state, current: {
        graphSiteId: payload
      } }
    default:
      return state
  }
}