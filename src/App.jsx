import React, { Component } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbardemo from './components/navbar.jsx';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Home from './components/Home.js';
import Login from './components/Login.js';
import Signup from './components/Signup.js';
import UserSettings from './components/UserSettings.js';
import UserFeed from './components/UserFeed.js';
import Error from './components/Error.js';
import {NotificationContainer} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import Timeline from './components/Timeline.js';
import SearchUser from "./components/SearchUser.js";

class App extends Component {

  constructor(props)
  {
    super(props);
    this.state = {
      //We need this field because component is rendered before resolution of the API call. Thus the solution is setting up this state after request is finished.
      //More info: https://stackoverflow.com/questions/51407402/react-router-dom-private-route-always-redirects-to-login
      isDeterminingAuth: true,

      //If the user is logged in
      isLoggedIn : false,

      //If isLoggedIn is true, this will contain the username.
      username : ""
    };
  }

  updateAuthInfo()
  {
    console.log(document.cookie);
    if(document.cookie !== "")
    {
        var username = document.cookie.split('=')[1];
        this.setState({isLoggedIn : true, username:username});
    }
    else
    {
      this.setState({isLoggedIn : false, username : ""});
    }
  }

  componentDidMount()
  {
    this.updateAuthInfo();
  }

  render() {
    return (

      <div className="App">
        <Router>
          <div className="App-header">
            <Navbardemo className="Navbardemo" loggedIn={this.state.isLoggedIn}
            username={this.state.username}/>
            <NotificationContainer/>
            <Switch>
              <Route exact path="/login" component={Login} />
              <Route exact path="/signup" component={Signup} />
              <Route exact path="/userSettings" component={() => this.state.isLoggedIn ? <UserSettings/> : <Home/>} />
              <Route exact path="/profile/:username" component={UserFeed}/>
              <Route exact path = "/searchUser/:searchName" component={SearchUser} />
              <Route exact path="/" component={() => this.state.isLoggedIn ?  <Timeline username={this.state.username}/> : <Home />} />
              <Route component={(props) => <Error message="Page cannot be found." statusCode="404"></Error>}/>
            </Switch>
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
