import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import NavDropdown from 'react-bootstrap/NavDropdown'
import { Link } from 'react-router-dom'
import Image from 'react-bootstrap/Image'
import Speech from 'react-speech';
import { withRouter } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';
import defaultPic from "./profilepicIcon.png";

import { Dropdown, DropdownButton } from 'react-bootstrap';

import './search.css';
import Modal from './Modal.js';

const imgScale = {
    "height" : "250px",
    "width" : "250px",
}

class SearchUser extends Component {
    constructor(props)
    {
        super(props);   
        
        this.state = {
              users : [],
              searchName : this.props.match.params.searchName ,
              showAllTags :  false,
              oneUserTags : []  
        }

        
      
      // functions
      this.getUsers = this.getUsers.bind(this);
      this.showTagsModal = this.showTagsModal.bind(this);
      this.renderAllTagsForm = this.renderAllTagsForm.bind(this);
      this.closeAllTagsModal = this.closeAllTagsModal.bind(this);
    }

    getUsers(searchValue) {
        let self = this;
        let postURL = "/api/search/" + searchValue;
        
        fetch(postURL, {
            
            method : 'POST',
            headers : {
                "Content-Type" : "application/json"
            },

        }).then(function(res){

            if(res.status === 200)
            {
                // console.log("SUCCESFULL RESPONSE");
                res.json().then(function(data){
                    let jsonData = JSON.parse(data);
                    // console.log("Response: ", jsonData);
                    self.setState({
                        users : jsonData
                    });
                    
                });
            }
            else
            {
                if(res.headers.has('error'))
                {
                    NotificationManager.error(res.headers.get('error'));
                }
                else
                {
                    NotificationManager.error("Unexpected error while searching.");
                }
            }
        });
    }
     
    componentDidMount() {
        this.getUsers(this.state.searchName);
    }

    showTagsModal(tags) {
        console.log("Showing modal with tags: ", tags);

        this.setState({
            oneUserTags : tags,
            showAllTags : true
        });
    }

    renderAllTagsForm() {
        
        var tagsToShow = this.state.oneUserTags;

        var shownTags = []
        
        var header = (
            <h3>All tags:</h3>
        );

        shownTags.push(header);

        // tagsToShow.map( (tag) => {
        //     shownTags.push( <p>#{tag}</p> );
        // });

        tagsToShow.map(function(tagName, index) { 
            return <span>{ ( index ? ', ' : '') + tagName}</span>;
        })

        // push the close button
        shownTags.push(<Button onClick={this.closeAllTagsModal}>Close</Button>);

        return (
            <div className = "showMoreDiv">
                {shownTags}
            </div>
        );
    }

    closeAllTagsModal() {
        this.setState({
            oneUserTags : [],
            showAllTags : false
        });
    }

    render() {
    //   console.log("Seaching for: ", this.state.searchName);
    //   console.log("Oneusertags: ", this.state.oneUserTags);

      let profiles = [];
      let tempUsers = this.state.users;
      let userName = null;
      let speechText = "";
      let noMatchButton = null;

      // check if users is empty  
      if (tempUsers.length === 0) {
          profiles = <h4 style={{margin : "auto", paddingTop : "50px"}}>No matches found</h4>
          speechText = "No matches found.";
          noMatchButton =  <Speech text={speechText} textAsButton={true} displayText="Play audio"/>;

      } else {
          // for each profile
          profiles = tempUsers.map( (user) => {
            // console.log("User: ", user);
            speechText = `Details of user ${user.username}`;
            // link the username to profile
            let usernameLink  = `/profile/${user.username}`;
            // console.log("Link", usernameLink);
            
            userName = (
            <a href={usernameLink}>
                <h3 className = "searchUsername">
                    {user.username}
                </h3>
            </a>
            );

            // formulate tags of user
            let tags = [];
            
            if ( user.tags_associated.length === 0) {
                let noItem = (  <Dropdown.Item>
                            No tags to show
                </Dropdown.Item>);
                tags.push(noItem);

            } else {
                // if less than 5 tags
                speechText += `Tags: `;
                tags = user.tags_associated.map( (tag) => {
                    speechText += `${tag},  `;
                    return  <Dropdown.Item >
                            {tag}
                        </Dropdown.Item>;
                });
            } 

            var userTagsDropdown = (
                <DropdownButton
                    title='User Tags'
                    variant='primary'
                >
                    {tags}
                </DropdownButton>
            );

            // TODO: Formulate the picture, setting default for now
            var chosenProfilePic = (
                <div onClick={() => window.location.href = usernameLink} className = "searchDPCont">
                    <img className = "searchDP" src={defaultPic} alt={user.username} style={imgScale}/>
                </div>
                    );


            if(user.profile_pic !== "" && user.profile_pic !== null && user.profile_pic !== "{}"){
                // console.log("IMAGE exists");
                chosenProfilePic = (
                    <div onClick={() => window.location.href = usernameLink} className = "searchDPCont">
                            <img className = "searchDP" src={user.profile_pic} alt={user.username} style={imgScale}/>
                    </div>
                            );

            }           

            // console.log("username: ", userName);
            // console.log("PIC: ", chosenProfilePic);

            return <div className="searchProfileContainter">
                            {chosenProfilePic}               
                            <h3>{userName}</h3>
                            <p>{userTagsDropdown}</p>   
                            <Speech text={speechText} textAsButton={true} displayText="Play audio"/>
                    </div>

          });
      }

      return (
        <div>
            <div className = "profilesContainer">
                {noMatchButton}
                {profiles}
            </div>

            <Modal className = "showMoreDiv" show = {this.state.showAllTags}>
                    {this.renderAllTagsForm()}
            </Modal>
        </div>
      )
    }
  }
  export default withRouter(SearchUser);