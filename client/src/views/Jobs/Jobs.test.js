import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router-dom';
import Jobs from './Jobs';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<MemoryRouter><Jobs /></MemoryRouter>, div);
  ReactDOM.unmountComponentAtNode(div);
});
