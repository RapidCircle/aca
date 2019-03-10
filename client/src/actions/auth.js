import fetch from 'cross-fetch';
import { REQUEST_ME } from '../constants.js';


function receiveData(data) {
    return {
        type: REQUEST_ME, 
        data
    }
}

function getApiData() {
    return dispatch => {
        return fetch('http://localhost:3000/_api/test')
            .then(response => response.json())
            .then(data => dispatch(receiveData(data)))
    }
}

export function selectMe() {
    return (dispatch, getState) => {
        return dispatch(getApiData());
    }
    
}

