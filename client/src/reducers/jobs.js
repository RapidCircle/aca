import {FETCH_JOBS, LOAD_JOBS} from '../constants';

const initialState = {
  data: []
}

export default function jobState(state = initialState, { type, payload }) {
  switch (type) {
    case FETCH_JOBS:
      return { ...initialState }
    case LOAD_JOBS:
      return { data: payload }
    default:
      return state
  }
}