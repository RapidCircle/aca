import {ERROR_FETCHING} from '../constants';

const initialState = {
}

export default function jobState(state = initialState, { type, payload }) {
  switch (type) {
    case ERROR_FETCHING:
      return { errorTitle: 'Error!', errorMessage: payload.message }    
    default:
      return state
  }
}