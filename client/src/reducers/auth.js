import { REQUEST_ME } from '../constants.js';

const initialState = {
    amount: -1,
    description: 'Nothing here'
}

export default function auth(state = initialState, action) {
    switch(action.type) {
        case REQUEST_ME:
            return Object.assign({}, state, {
                amount: action.data.amount,
                description: action.data.description
            });
        default:
            return state;
    }
}