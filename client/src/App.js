import React, { Component } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { login, logout } from './actions/user';

// import { renderRoutes } from 'react-router-config';
import {
  userIsAuthenticatedRedir,
  userIsNotAuthenticatedRedir
} from './auth.js';

import Loadable from 'react-loadable';
import './App.scss';


const loading = () => <div className="animated fadeIn pt-3 text-center">Loading...</div>;

// Containers
const DefaultLayout = userIsAuthenticatedRedir(Loadable({
  loader: () => import('./containers/DefaultLayout'),
  loading
}));

// Pages
const Login = userIsNotAuthenticatedRedir(Loadable({
  loader: () => import('./views/Pages/Login'),
  loading
}));

const Register = Loadable({
  loader: () => import('./views/Pages/Register'),
  loading
});

const Page404 = Loadable({
  loader: () => import('./views/Pages/Page404'),
  loading
});

const Page500 = Loadable({
  loader: () => import('./views/Pages/Page500'),
  loading
});

class App extends Component {

  componentDidMount() {
    const { dispatch } = this.props;

    window.onmessage = (e) => {
      if (e.data === 'setloggedin') {
        dispatch(login({ isAdmin:false }));
      }
      else if (e.data === 'setloggedout') {
        dispatch(logout());
      }
    }
  }

  render() {
    return (
      <HashRouter>
          <Switch>
            <Route exact path="/login" name="Login Page" component={Login} />
            <Route exact path="/register" name="Register Page" component={Register} />
            <Route exact path="/404" name="Page 404" component={Page404} />
            <Route exact path="/500" name="Page 500" component={Page500} />
            <Route path="/" name="Home" component={DefaultLayout} />
          </Switch>
      </HashRouter>
    );
  }
}

const mapStateToProps = state => ({
  user: state.user
  //user: { isLoading:false, data: { test: 123}}
})

export default connect(mapStateToProps)(App);

