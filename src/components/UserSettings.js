import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Nav from "react-bootstrap/Nav";
import profilePic from "./profilepicIcon.png";
import Image from "react-bootstrap/Image";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Profile from './Profile.js';
import Form from 'react-bootstrap/Form'
import {NotificationManager} from 'react-notifications';
import { confirmAlert } from 'react-confirm-alert'; // Import
import Modal from './Modal';
import './userSettings.css';

class UserSettings extends Component {
  //Get logged in user and render accordingly

  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      //oldPass: "",
      bio: "",
      name: "",
      profile_pic: "",
      interests: "",
      accessibility_features: "",
      showPasswordForm : false,
      //This is for confirm deletion.
      inputPassword : "",
      email : ""
    };

    this.handleEditBio = this.handleEditBio.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.getUserInfo = this.getUserInfo.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.handleDeleteAccount = this.handleDeleteAccount.bind(this);
    this.renderPasswordConfirm = this.renderPasswordConfirm.bind(this);
    this.handlePassChange = this.handlePassChange.bind(this);
    this.openPasswordModal = this.openPasswordModal.bind(this);
    this.closePasswordModal = this.closePasswordModal.bind(this);
    this.handleConfirmEmailChange = this.handleConfirmEmailChange.bind(this);
    this.handleInterestsChange = this.handleInterestsChange.bind(this);
    this.imageFile = React.createRef();
    //this.handleOldPaswordChange = this.handleOldPaswordChange.bind(this)
  }

  //This is for updating the password.
  handlePasswordChange(event)
  {
    this.setState({password : event.target.value});
  }
  // handleOldPaswordChange(event){
  //   this.setState({oldpassword : event.target.value});
  // }

  handleEditBio(event) {
    this.setState({bio: event.target.value});
  }

  handleInterestsChange(event) {
    this.setState({interests: event.target.value});
  }

  handleSubmit(event)
  {
    event.preventDefault();
    //split the interests into array
    let interestsArray = [];
    console.log(this.state.interests);
    if(this.state.interests.length > 0)
    {
      let ints = this.state.interests;
      interestsArray = ints.split(',');
    }

    var formdata = new FormData();
    formdata.append('password', this.state.password);
    //formdata.append('oldPass', this.state.oldPass);
    formdata.append('bio', this.state.bio);
    formdata.append('name', this.state.name);
    formdata.append('interests', JSON.stringify(interestsArray));
    formdata.append('accessibility_features', JSON.stringify(this.state.accessibility_features));
    formdata.append('profileImage', this.imageFile.current.files[0]);

    //console.log(formdata)

    fetch(`/api/update/${this.state.username}`, {
        method : 'POST',
        redirect: 'follow',
        body: formdata//JSON.stringify(body)
    }).then(function(res)
    {
      if(res.status === 200)
      {
        NotificationManager.success("Saved changes");
        window.location.reload();
      }
      else
      {
        if(res.headers.has('error'))
        {
          NotificationManager.error(res.headers.get('error'));
        }
        else
        {
          NotificationManager.error('Unexpected error while updating profile information.');
        }
      }

      

    }).catch(function(error){
      console.log(error);
    }
    );
  }


  handleDeleteAccount()
  {
    let requestBody = {
      username : this.state.username,
      password : this.state.inputPassword,
      email : this.state.email
    }
    console.log(requestBody);
    //Send request to server with username, email, password on body.
    fetch("/api/delete", {
      method : 'POST',
      headers : {
        "Content-Type" : "application/json"
      },
      body : JSON.stringify(requestBody)
    }).then((res) => {
        if(res.status === 200)
        {
          NotificationManager.success("Account deleted successfully!");
          document.cookie = ""; //Clear cookies.
          setTimeout(function() { //Start the timer
            window.location.href = "/"; //Redirect.
        }.bind(this), 900)
      }
      else
      {
        if(res.headers.has('error'))
        {
          console.log("error header exists.");
          console.log(res.headers.get('error'));
          NotificationManager.error(res.headers.get('error'));
        }
        else
        {
          NotificationManager.error("Error has occured.");
        }
      }
    }).catch((err) => {
      console.log("Unknown issue.");
      NotificationManager.error(err);
    })
  }

  handlePassChange(event)
  {
    this.setState({inputPassword : event.target.value});
  }

  handleConfirmEmailChange(event)
  {
    this.setState({email : event.target.value});
  }

  renderPasswordConfirm()
  {
    return <div>
      <label>Please confirm deletion by re-entering your email and password.</label>
      <p style={{'display' : 'block', 'margin' : 'auto'}}>Email</p>
      <input type="email" onChange={this.handleConfirmEmailChange} style={{'display' : 'block', 'margin' : 'auto'}}></input>
      <p style={{'display' : 'block', 'margin' : 'auto'}}>Password</p>
      <input type="password" onChange={this.handlePassChange} style={{'display' : 'block', 'margin' : 'auto'}}></input>
      <Button onClick={this.handleDeleteAccount}  style={{'margin' : '1vw'}}>Confirm</Button>
      <Button onClick={this.closePasswordModal} style={{'margin' : '1vw'}}>Cancel</Button>
    </div>
  }

  getUserInfo() {

    var username = document.cookie.split('=')[1];
    let d_bio ="";
    let d_name = "";
    let d_interests = "";
    let d_profilepic ="";
    let self = this;
    // console.log("USERNAME=", username);
    fetch(`/api/users/${username}`, {
      method: 'POST',
      headers: {
          'Content-Type' : 'application/json'
      }
    }).then(function(res){

      if(res.status === 200)
      {
        res.json().then(function(data){
            let dataDict = JSON.parse(data);
            console.log(dataDict);
            let usernameInScope = dataDict.username;
            d_profilepic = dataDict.profile_pic;
            d_bio = dataDict.bio;
            d_name = dataDict.name;
            d_interests = dataDict.interests
            if(dataDict.interests !== null)
            {
              d_interests = d_interests.toString();
            }
            self.setState({username: usernameInScope, bio: d_bio, name: d_name, interests: d_interests, profile_pic: d_profilepic});

        });
      }
    });


  }
  componentDidMount()
  {
    this.getUserInfo();
  }

  openPasswordModal()
  {
    this.setState({showPasswordForm : true});
  }

  closePasswordModal()
  {
    this.setState({showPasswordForm : false});
  }

  render() {
    let profile = null;
    if(this.state.username !== "")
    {
      profile = <Profile username={this.state.username} />;
    }

    return (

      <div>
        <div className = "page-container">
                <div className="page-content">
                  {profile}
                </div>
                <div className="page-content">
                <Form onSubmit={this.handleSubmit}>
                  <Form.Group>
                      <Form.Label>Bio</Form.Label>
                      <Form.Control type="text" placeholder="Bio" onChange={this.handleEditBio}/>
                  </Form.Group>

                  <Form.Group>
                      <Form.Label>Password</Form.Label>
                      <Form.Control type="password" placeholder="Password" onChange={this.handlePasswordChange}/>
                  </Form.Group>
                  <Form.Group>
                      <Form.Label>Add Interests</Form.Label>
                      <Form.Control type="text" placeholder="Add interests separated by a ','" value={this.state.interests} onChange={this.handleInterestsChange}/>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Profile Image</Form.Label>
                    <Form.Control type="file" accept="image/*" ref={this.imageFile}/>
                  </Form.Group>

                  <Form.Group>
                    <Button className = "delete-button" variant="primary" type="submit">Save Changes</Button>
                  </Form.Group>
               </Form>
              </div>
              <div className="page-content">
                <Button variant="primary" onClick={this.openPasswordModal}>Delete Account </Button>
              </div>
         </div>


        <Modal show={this.state.showPasswordForm}>
          {this.renderPasswordConfirm()}
        </Modal>
      </div>
    );
  }
}

export default UserSettings;
