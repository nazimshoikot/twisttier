import React, {Component} from 'react';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import './LoginSignup.css'
import Container from 'react-bootstrap/Container';
import {NotificationManager} from 'react-notifications';

const LOCAL_URL = "localhost:8080";

class Signup extends Component {

  constructor(props)
  {
    super(props);
    this.state = {
      email : "",
      password : "",
      repeatedPassword: "",
      username : "",
      name : "",
      bio : ""
    };

    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleRepeatedPassChange = this.handleRepeatedPassChange.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleBioChange = this.handleBioChange.bind(this);
    this.imageFile = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleEmailChange(event)
  {
    this.setState({email : event.target.value});
  }

  handlePasswordChange(event)
  {
    this.setState({password : event.target.value});
  }

  handleRepeatedPassChange(event)
  {
    this.setState({repeatedPassword : event.target.value});
  }

  handleUsernameChange(event)
  {
    this.setState({username : event.target.value});
  }  
  handleNameChange(event)
  {
    this.setState({name : event.target.value});
  }

  handleBioChange(event)
  {
    this.setState({bio : event.target.value});
  }

  handleSubmit(event)
  {
    event.preventDefault();
    
    if(this.state.password != this.state.repeatedPassword)
    {
      //Passwords do not match.
      NotificationManager.error("Passwords do not match.");
      return;
    }
    var formdata = new FormData();
    formdata.append('email', this.state.email);
    formdata.append('password', this.state.password);
    formdata.append('username', this.state.username);
    formdata.append('name', this.state.name);
    formdata.append('bio', this.state.bio);
    formdata.append('profileImage', this.imageFile.current.files[0]);

    fetch("/create_user", {
      method : 'POST',
      redirect : 'follow',
      body : formdata 
    }).then(function(res){
      //Response returned.
      if(res.status === 200)
      {
        NotificationManager.success("User created. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 800);
      }
      else{
        if(res.headers.has('error'))
        {
          NotificationManager.error(res.headers.get('error'));
        }
        else
        {
          NotificationManager.error("User cannot be created.");
        }
      }
      
    }).catch(function(err){
      NotificationManager.error(err);
    });
  }
  render()
  {
    return (
        <div className="LoginSignup">
          <Container>
          <h1>Sign Up</h1>
            <Form onSubmit={this.handleSubmit}>
                <Form.Group controlId="formNewEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Email (Required)" onChange={this.handleEmailChange} required/>
                </Form.Group>

                <Form.Group controlId="formNewPasswrd">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password (Required)" onChange={this.handlePasswordChange} required/>
                </Form.Group>

                <Form.Group controlId="formConfirmPasswrd">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" placeholder="Confirm Password (Required)" onChange={this.handleRepeatedPassChange} required/>
                </Form.Group>
                 <Form.Group controlId="formNewUsername">
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="username" placeholder="Username (Required)" onChange={this.handleUsernameChange} required/>
                </Form.Group>

                <Form.Group controlId="formNewName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="name" placeholder="Name (Required)" onChange={this.handleNameChange}/>
                </Form.Group>

                <Form.Group controlId="formNewBio">
                    <Form.Label>Bio</Form.Label>
                    <Form.Control as="textarea" rows = "2" placeholder ="Insert Bio Here" onChange={this.handleBioChange}/>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Profile Image</Form.Label>
                  <Form.Control type="file" accept="image/*" ref={this.imageFile}/>
                </Form.Group>

                <Button variant="primary" type="submit">Create Account</Button>
            </Form>
            </Container>
        </div>
    )
  }
}


export default Signup;
