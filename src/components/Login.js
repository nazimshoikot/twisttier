import React, {
  Component
} from 'react';
import Nav from 'react-bootstrap/Nav';
import {
  Link
} from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {
  withRouter
} from 'react-router-dom';
import './LoginSignup.css';
import Container from 'react-bootstrap/Container'
import {NotificationManager} from 'react-notifications';
import { emptyStatement } from '@babel/types';

const LOCAL_URL = "localhost:8080";
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      emailOrUsername: "",
      password: "",
      notification : ""
    }
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleUserOrEmailChange = this.handleUserOrEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
  }

  handleUserOrEmailChange(event) {
    this.setState({
      emailOrUsername: event.target.value
    });
  }

  handlePasswordChange(event) {
    this.setState({
      password: event.target.value
    });
  }

  /**
   * Determines whether the first field is username or email.
   */
  getAppropiateState(field)
  {
    //Email regex taken from https://www.w3resource.com/javascript/form emailOrUsername-validation.php
    let resultState = {};
    var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var usernameRegex = /^(_|[a-zA-Z])([a-zA-Z]|_|[0-9])*$/;
    if(emailRegex.test(field))
    {
      resultState.email = field;
      resultState.username = "";
    }
    else if(usernameRegex.test(field))
    {
      resultState.username = field;
      resultState.email = "";
    }
    else{
      resultState.error = "The field you entered is not a valid entry.";
    }

    return resultState;
  }

  /**
   * When the submit event is triggered, the properties will be in the state.
   * @param {*} event The submit event.
   */
  handleSubmit(event) {
    event.preventDefault();

    let writtenCredentials = this.getAppropiateState(this.state.emailOrUsername);
    writtenCredentials.password = this.state.password;
    fetch("/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      body: JSON.stringify(writtenCredentials)
    }).then( (res) => {
      //Got response from server.
      if(res.status === 200)
      {
        //Redirecting to home page.
        NotificationManager.success("Login successful!"); 
        setTimeout(() => window.location.href = "/", 900);
      }
      else{
        NotificationManager.error("Invalid username / email");
        return;
      }

    }).catch(function (error) {
      NotificationManager.error(error);
    });
  }
  render() {
    
    return ( 
        <div className = "LoginSignup">
          <Container >
          <h1>Login</h1>
          <Form onSubmit = {this.handleSubmit} >
            <Form.Group controlId = "formBasicEmail" >
              <Form.Label>Username or email address</Form.Label> 
              <Form.Control width = "50%" placeholder = "Email" onChange = {this.handleUserOrEmailChange}/>
            </Form.Group>
            <Form.Group controlId = "formBasicPasswrd" >
              <Form.Label>Password</Form.Label> 
              <Form.Control type = "password"
              placeholder = "Password"
              onChange = {
                this.handlePasswordChange
              }
              /> 
            </Form.Group>
            <Button variant = "primary" type = "submit">Login</Button> 
          </Form> 
          <Nav.Link>
            <Link to = "/signup">Don't have an account? Signup!</Link> 
          </Nav.Link> 
          </Container> 
        </div>
    );
  }

}
export default Login