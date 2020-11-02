import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import App from './components/App';
import { BrowserRouter as Router, Route, Switch, withRouter } from 'react-router-dom';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import 'semantic-ui-css/semantic.min.css'
import { Auth } from './firebase';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import rooteducer from './reducers';
import { setUser, clearUser } from './actions';
import Spinner from './Spinner';

const store = createStore(rooteducer, composeWithDevTools());

class Root extends React.Component{

  componentDidMount() {
    Auth.onAuthStateChanged(user => {
      if(user){
        this.props.setUser(user);
        this.props.history.push('/');
      }else{
        this.props.history.push('/login');
        this.props.clearUser();
      }
    });
  }

  render () {
    // return (
    return this.props.isLoading ? <Spinner /> : (
        <Switch>
          <Route exact path='/' component={App}/>
          <Route path='/login' component={Login}/>
          <Route path='/register' component={Register}/>
        </Switch>
    )
  }
}

const mapStateToProps = (state) =>({
  isLoading : state.user.isLoading
})

const RootWithAuth = withRouter(
  connect(mapStateToProps, 
    {setUser, clearUser}
  )(Root))

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <RootWithAuth />
    </Router>
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
