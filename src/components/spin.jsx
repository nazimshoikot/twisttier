import React from 'react';
import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import './spin.css';
import PropTypes from 'prop-types';
import {NotificationManager} from 'react-notifications';
import { throwStatement } from '@babel/types';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css' // Import css
import Modal from './Modal.js';
import Form from 'react-bootstrap/Form';
import LikeImage from './like.png';
import unlikeImage from './unlike.png';
import Image from 'react-bootstrap/Image';
import editImage from './edit.png';
import shareImage from './share.png';
import deleteImage from "./delete.png";
import showMoreButton from "./showMore.png";
import Speech from "react-speech";
import Flame from "./flame.png";
import QuotedSpin from "./QuotedSpin";

const tagContainerStyle = {
    display: "grid",
    "grid-template-columns" : "auto auto auto auto auto",
    "align-content" : "center",
    "max-width" : "100%",
    "grid-size" : "auto",
    zIndex: 0,
    "margin" : "auto",
    "padding-top" : "2vh"
};

const MAX_TAGS = 3;

/**
 * The spin component that displays username, message content and user timestamp.
 */
class Spin extends Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            tags: this.props.tags, //spin's tags
            edited: false, //the spin has been edited
            quoted: this.props.quoted || false, //the spin is using a quote? Default is false
            quote: null, //quote view.
            content: this.props.content, //spin's text
            timestamp: this.props.timestamp, //spin modified
            likes : this.props.likes,
            spinID : this.props.spinID,
            showLike : true,
            viewingUserTags : this.props.tagsFollowedForThisSpin,
            likeList: this.props.likeList,
            hasNewTags : this.props.hasNewTags || false,
            // for handling the edit form modal
            sharedSpinText : " ",
            sharedSpinTags:[],
            showEditer : false,
            showShare : false,
           /// initialEditorValue : this.props.content,
            newTagText : "",
            showMoreTagsModal : false
        };

        this.likeSpin = this.likeSpin.bind(this);
        this.unlikeSpin = this.unlikeSpin.bind(this);
        this.viewerIsAuthenticated = this.viewerIsAuthenticated.bind(this);

        this.userToView = this.props.userToView; //viewer
        this.author = this.props.username;
        this.spinID = this.props.spinID;
        this.interestsOfUser = this.props.userInterests;
        //quoteInfo is in form of:
        // {username : "username", spinId : <int>}  
        this.quoteOrigin = this.props.quoteOrigin || undefined;     

        //this.followTag = this.followTag.bind(this);
        //this.unfollowTag = this.unfollowTag.bind(this);
        this.updateViewerTags = this.updateViewerTags.bind(this);
        this.updateWhetherViewerLikedTheSpin = this.updateWhetherViewerLikedTheSpin.bind(this);
        this.formatDate = this.formatDate.bind(this);

        // functions to delete spin
        this.deleteSpin = this.deleteSpin.bind(this);

        // functions for edit modal
        this.showEditModal = this.showEditModal.bind(this);
        this.closeEditModal = this.closeEditModal.bind(this);
        this.renderEditForm = this.renderEditForm.bind(this);

        this.showShareModal = this.showShareModal.bind(this);
        this.closeShareModal = this.closeShareModal.bind(this);
        this.renderShareForm = this.renderShareForm.bind(this);

        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleShareTextChange = this.handleShareTextChange.bind(this);
        this.handleInterestAddition = this.handleInterestAddition.bind(this);
        this.handleInterestDeletion = this.handleInterestDeletion.bind(this);
        this.handleNewTagTextChange = this.handleNewTagTextChange.bind(this);
        this.handNewTagAddition = this.handleNewTagAddition.bind(this);
        this.handleEditPostSubmission = this.handleEditPostSubmission.bind(this);
        this.handleSharePostSubmission = this.handleSharePostSubmission.bind(this);
        this.openMoreTagsModal = this.openMoreTagsModal.bind(this);
        this.closeMoreTagsModal = this.closeMoreTagsModal.bind(this);
        this.getUserTags = this.getUserTags.bind(this);
    }

       /**
     * Helper method for getting tags of the author
     */
    getUserTags(followingList, author)
    {
        // console.log(followingList);
        // console.log(author);
        if(followingList === undefined || followingList.users.length === 0) 
        {
            console.log("Return empty");
            return [];//Empty list
        }
        // console.log(followingList.users.length);
        for(var i = 0; i < followingList.users.length; i++)
        {
            if(followingList.users[i].username === author)
            {
                return followingList.users[i].tags;
            }
        }
        // console.log("Return empty from end.");
        return [];//Empty list
    }

    getAuthor()
    {
        return this.author;
    }
    
    // likes spin 
    likeSpin()
    {
        let esteemBody = {
            postAuthor: this.author,
            action: 'like',
            liker: this.userToView,
            spinID: this.spinID
        };

        let self = this;
        // console.log("Liking spin");
        fetch("/api/spins/esteem", {
            method : 'POST',
            headers : {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(esteemBody)
        }).then(function(res){
            if(res.status === 200)
            {
                res.json().then(function(data){
                    let jsonData = JSON.parse(data);
                    self.setState({likes : jsonData.likes, showLike : false});
                    NotificationManager.success('You liked the post!');
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
                    NotificationManager.error("Unexpected error while liking spin.");
                }
            }
        });
    }

    // unlikes spin
    unlikeSpin()
    {
        let esteemBody = {
            postAuthor: this.author,
            action: 'unlike',
            liker: this.userToView,
            spinID: this.spinID
        };

        let self = this;
        // console.log("Unliking spin");
        fetch("/api/spins/esteem", {
            method : 'POST',
            headers : {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(esteemBody)
        }).then(function(res){
            if(res.status === 200)
            {
                console.log("Unlike OK response");
                res.json().then(function(data){
                    console.log("Unlike sent data.");
                    let jsonData = JSON.parse(data);
                    NotificationManager.success('Unlike successful.');
                    self.setState({likes : jsonData.likes, showLike : true});

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
                    NotificationManager.error("Unexpected error while liking spin.");
                }
            }
        });
    }

    // follows tags of spins
    followTag(tagName)
    {
        console.log("Following")
        let tagList = [];
        // console.log(tagName);
        tagList.push(tagName);
        let jsonBody = {
            action : 'follow',
            toFollow : this.author,
            tags : tagList,
            follower : this.userToView
        };
        // console.log(jsonBody);
        let self = this;
        fetch("/api/updateFollowing", {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(jsonBody)
        }).then(function(res){
            if(res.status === 200)
            {
                console.log("Successfully followed user");
                NotificationManager.success(`You followed ${tagName} from ${self.author}`);
                setTimeout(function() { //Start the timer
                    window.location.reload();
                }.bind(this), 900)
            }
            else{
                if(res.headers.has("error"))
                {
                    NotificationManager.error(res.headers.get('error'));
                }
                else
                {
                    NotificationManager.error("Server didn't return OK response.");
                }
            }
        });
    }

    // unfollows tags of spin
    unfollowTag(tagName)
    {
        let tagList = [];
        // console.log(tagName);
        tagList.push(tagName);
        let jsonBody = {
            action : 'unfollow',
            toFollow : this.author,
            tags : tagList,
            follower : this.userToView
        };
        // console.log(jsonBody);
        let self = this;
        fetch("/api/updateFollowing", {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(jsonBody)
        }).then(function(res){
            if(res.status === 200)
            {
                console.log("Unfollowed successfully");
                NotificationManager.success(`You unfollowed ${tagName} from ${self.author}`);
                setTimeout(function() { //Start the timer
                    window.location.reload();
                }.bind(this), 1000)
            }
            else{
                if(res.headers.has("error"))
                {
                    NotificationManager.error(res.headers.get('error'));
                }
                else
                {
                    NotificationManager.error("Server didn't return OK response.");
                }
            }
        });
    }

    //Returns a boolean indicating the user already liked the spin.
    updateWhetherViewerLikedTheSpin()
    {
        if(this.state.likeList.includes(this.userToView))
        {
            this.setState({showLike : false});
        }
        else
        {
            this.setState({showLike : true});
        }
    }

    updateViewerTags()
    {
        //Since "this" changes when you enter a new context, we have to keep the reference for using it inside fetch.
        const self = this;
        // console.log(`/api/users/${self.userToView}`);
        fetch(`/api/users/${self.userToView}`, {
            method : 'POST',
            headers: {
                'Content-Type' : 'application/json'
            }
        })
        .then(function(res)
        {
          // console.log(res);
          if(res.status === 200)
          {
            res.json().then(function(jsonData)
            {
                const dataDict = JSON.parse(jsonData);
                let followingList = dataDict.following;
                // console.log(followingList);
                // console.log(self.author);
                let followedTagsFromAuthor = self.getUserTags(followingList, self.author);
                console.log("Followed tags from author: " + followedTagsFromAuthor);
                self.setState({ viewingUserTags: followedTagsFromAuthor});
              })
          }
          else
          {
            if(res.headers.has('error'))
            {
                NotificationManager.error(res.headers.get('error'));
            }
            else
            {
                NotificationManager.error("Server didn't return an OK response.");
            }
          }
        })
        .catch(function(err){
            console.log(err);
            self.setState({error : err});
        })
        ;
    }

    // checks whether viewer is logged in or nor
    viewerIsAuthenticated()
    {
        return document.cookie !== "";
    }

    componentDidMount()
    {
        if(this.viewerIsAuthenticated())
        {
            this.updateWhetherViewerLikedTheSpin();
            this.updateViewerTags();
        }
        this.updateQuote();
    }

    updateQuote()
    {
        if(this.state.quoted) //If quoted is true, quoteOrigin should contain the dict of username and id.
        { 
          // console.log('this =',this)
            let quotedUsername = this.quoteOrigin['username'];
            let quotedID = this.quoteOrigin['spinId'];
            let requestBody = {
                spinID : quotedID
            }
            // console.log('quote origin:', this.quoteOrigin);
            // console.log('original poster:', quotedUsername);
            // console.log("post id:", quotedID);
            let self = this;
            fetch(`/api/spin/${quotedUsername}`, {
                method : "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify(requestBody)
            })
            .then((res) => {
                if(res.status === 200)
                {
                    res.json().then((jsonData) => {
                        let spin = JSON.parse(jsonData);
                        console.log('spin =',spin);
                        let quotedView = <QuotedSpin username={spin.username} content={spin.content}
                        timestamp={spin.date} spinID = {spin.id}
                        userToView={self.userToView} tags={spin.tags}
                        likes= {spin.likes} likeList = {spin.like_list}
                        />
                        self.setState({quote : quotedView});
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
                        NotificationManager.error("Server didn't return OK response.");
                    }
                }
            })
            .catch((err) => {
                NotificationManager.error(err);
            });
        }
    }

    // formats the date
    formatDate(timestamp)
    {
        let dateAndTime = timestamp.split('T');
        let time = dateAndTime[1].substring(0, 5);
        return dateAndTime[0] + " " + time;
    }


    // deletes the spin
    deleteSpin() {
        console.log("Deleting spin");
        let deleteSpinID = this.spinID;
        let spinAuthor = this.author;
        let spinToBeDeleted = {"spinId" : deleteSpinID};

        // console.log("SpinID: ", spinToBeDeleted);
        // console.log("username: ", this.author);

        // TODO:call the server function and refresh the page
        let self = this;
        fetch("/api/deleteSpin/" + spinAuthor, {

            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(spinToBeDeleted)

        }).then(function(res){
            if(res.status === 200)
            {
                // console.log("status:", res.status);
                NotificationManager.success("Spin has been deleted");
                
                // show the notification and then delete
                setTimeout(function() { //Start the timer
                    window.location.reload();
                }.bind(this), 900)
                
                // console.log("Spin deleted");
            }
            else{
                if(res.headers.has("error"))
                {
                    NotificationManager.error(res.headers.get('error'));
                }
                else
                {
                    NotificationManager.error("Server didn't return OK response.");
                }
            }
        });
    }

    // asks for Confirmation for delete spin
    askForConfirmation = () => {
        confirmAlert({
          title: 'Confirm to Delete',
          message: 'Are you sure you want to delete this post?',
          buttons: [
            {
              label: 'Yes',
              onClick: () => this.deleteSpin()
            },
            {
              label: 'No',
              onClick: () => {console.log("user chose not to delete spin")}
            }
          ]
        })
    };
    

    // handles change of text for spin
    handleTextChange(event){
        if (event.target.value.length <= 90) {
            this.setState({
                content : event.target.value
            }); 
        }
        
    }

    // handles change of interest for spin
    handleInterestAddition(newTag) { 

        let tagList = this.state.tags;
        if(!tagList.includes(newTag))
        {
            tagList.push(newTag);
        }
        this.setState({
            tags : tagList
        });

    }

    // handles deletion of tag from the post
    handleInterestDeletion(oldTag) {

        let tagList = this.state.tags;

        // find index of the tag
        let indexOfTag = tagList.indexOf(oldTag);

        // delete the tag
        if (indexOfTag != -1) {
            tagList.splice(indexOfTag, 1);
        }
        // reset the state
        this.setState({
            tags : tagList
        });
    }

    // handles the change of text of new tag to be added
    handleNewTagTextChange(event) {
        this.setState({newTagText : event.target.value});
    }

    // handles the addition of a complete new tag
    // NOTE: different format of function used because this format does
    // create a "this" of itself and so, "this" can be used normally
    // to avoid confusion
    handleNewTagAddition = (event) => {
        event.preventDefault();
        this.handleInterestAddition(this.state.newTagText);

        // reset the newTagText
        this.setState({newTagText : ""})
    }

    showShareModal() {
        this.setState({showShare : true});
    }
    closeShareModal() {
        setTimeout(function() { //Start the timer
            window.location.reload();
        }.bind(this), 900)    
        this.setState({showShare : false})
    }

    // show the edit post modal
    showEditModal() {
        this.setState({showEditer : true})
        // console.log("Initial values:", this.state.initialValues);
    }

    // closes the edit post modal
    closeEditModal() {
        window.location.reload();

        this.setState({            
            // close the modal
            showEditer : false
        })
    }
    
    // sends the edited post to server and refreshes the front end
    // TODO: handle server response
    handleEditPostSubmission(){
       
        if(this.state.tags === undefined || this.state.tags.length <= 0) {
            NotificationManager.error("You must have a tag!");
            return;
        }


        let body = {
        tags: this.state.tags,
        spinBody: this.state.content,
        spinID : this.state.spinID,
        }

        console.log(body);
        

        // send the data to server, refresh the location
        let spinAuthor = this.author;
        let self = this;
        fetch("/api/edit_spin/" + spinAuthor, {

            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(body)

        }).then(function(res){

            if(res.status === 200)
            {
                // show the notification and then close the modal
                NotificationManager.success("Spin has been edited");       

                self.setState({
                    // close the modal
                    showEditer : false
                });
                
            }
            else{
                if(res.headers.has("error"))
                {
                    NotificationManager.error(res.headers.get('error'));
                }
                else
                {
                    NotificationManager.error("Server didn't return OK response.");
                }
            }
        });
    }

    handleSharePostSubmission(){

        if(this.state.tags === undefined || this.state.tags.length <= 0) {
            NotificationManager.error("You must have a tag!");
            return;
        }

        let self = this;
        let body = {
            spinBody: this.state.sharedSpinText,
            tags: this.state.tags,
            is_quote: true,
            quote_origin: {
                username: this.author,
                spinId: this.state.spinID,
            }
        };
        
        console.log("Text:" + this.state.sharedSpinText);
        fetch(`/api/add_spin/${this.userToView}`, {
            method : 'POST',
            headers : {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(body)
        }).then(function(res){
            if(res.status === 200)
            {
                NotificationManager.success("Shared!");
                self.closeShareModal();
            }
            else
            {
                if(res.headers.has("error"))
                {
                    NotificationManager.error(res.headers.get('error'));
                }else
                {
                    NotificationManager.error("Server didn't return OK response.");
                }
            
            }
        });
    }

    // creates the components of the edit modal
    renderEditForm() {
        let userInterestsCopy = this.interestsOfUser;

        // console.log("user interests after: ", userInterestsCopy);
        
        let spinInterests = [];
        
        // return all the tags the user has posted with before
        if(userInterestsCopy !== undefined)
        {
            spinInterests = userInterestsCopy.map((tagName) => {

                if (!this.state.tags.includes(tagName)){
                    return  <Dropdown.Item onClick={() => this.handleInterestAddition(tagName)}>
                            {tagName}
                            </Dropdown.Item>;
                }
            });
        }

        let userInterestsDropdown = null;
        
        // create a dropdown using those interests. If list is empty, then the view will only consist of text.
        if(spinInterests.length === 0)
        {
            userInterestsDropdown = <h3>This user don't have any interests.</h3>
        }
        else
        {
            userInterestsDropdown = (
                <DropdownButton
                    title='   Add from Existing Tags   '
                    variant='outline-success'
                    block
                    className = "editButtons"
                >
                    {spinInterests}
                </DropdownButton>
            );
        }

        // show all the tags that are already associated with the spin in a dropdown
        let initialTags = this.state.tags;

        let initialTagsDropdown = [];

        if(initialTags !== undefined)
        {
            initialTagsDropdown = initialTags.map((tagName) => {
                return  <Dropdown.Item onClick={() => this.handleInterestDeletion(tagName)}>
                            {tagName}
                        </Dropdown.Item>;
            });
        }

        let addedTagsDropdown = null;
        
        if(initialTagsDropdown.length === 0)
        {
            addedTagsDropdown = <h3>This spin doesn't associate with any tags.</h3>
        }
        else
        {
            // create a dropdown using those interests
            addedTagsDropdown = (
                <DropdownButton
                    title='Remove from Existing Tags'
                    variant='outline-danger'
                    block
                    className = "editButtons"
                >
                    {initialTagsDropdown}
                </DropdownButton>
            );
        }


        return (
            <div className="spin-form">
                    <Form >
                        <Form.Label>Edit Spin</Form.Label>
                        <Form.Control 
                            as = "textarea" 
                            value= {this.state.content}
                            rows="3" 
                            onChange = {this.handleTextChange}
                        />
                            <p>{this.state.content.length}/90 characters</p>
                        
                        {userInterestsDropdown}
                        {addedTagsDropdown}
                    </Form>

                    <Form onSubmit = {this.handleNewTagAddition}>
                        <Form.Control
                            width = "40%"
                            placeholder = "Add new tag"
                            onChange = {this.handleNewTagTextChange}
                            value = {this.state.newTagText}
                        />

                        <Button className = "editButtons" variant = "outline-primary" type = "submit">Add a new tag</Button>
                    </Form>


                <div className="modal-footer">
                    <Button variant = "outline-primary" onClick = {this.handleEditPostSubmission}>Edit</Button>
                    <Button variant = "outline-primary" onClick={this.closeEditModal}>Cancel</Button>
                </div>
            </div>

        );
    }

    handleShareTextChange(event)
    {
        let updatingText = event.target.value;
        if(event.target.value !== undefined && event.target.value.length > 90)
        {
            updatingText = updatingText.substring(0, 90);
        }
        this.setState({sharedSpinText : updatingText});
    }

    renderShareForm(){        
        // get all the tags the user has posted with before
       // let newInterestOptions = [];
        let self = this;
        // let newAuthorInterests = this.viewersTags;

        // if(newAuthorInterests !== undefined)
        // {
        //     newInterestOptions = newAuthorInterests.map((tagName) => {

        //         if (!(this.state.tags !== undefined && this.state.tags.includes(tagName))){
        //             return  <Dropdown.Item onClick={() => this.handleInterestAddition(tagName)}>
        //                     {tagName}
        //                     </Dropdown.Item>;
        //         }
        //     });
        // }
        // // create dropdown of previously used tags    
        // let newInterestsDropdown = null;
        
        // // create a dropdown using those interests. If list is empty, then the view will only consist of text.
        // if(newInterestOptions.length === 0)
        // {
        //     newInterestsDropdown = <h3>You don't have any tags yet.</h3>
        // }
        // else
        // {
        //     newInterestsDropdown = (
        //         <DropdownButton
        //         title='   Add from Suggested Tags   '
        //         variant='outline-success'
        //         block
        //         className = "shareButtons"
        //         >
        //             {newInterestOptions}
        //         </DropdownButton>
        //     );
        // }

        let addedInterests = null;
        if (this.state.tags !== undefined) {
            addedInterests = this.state.tags.map((tagName) => {
                return <h6>{tagName}</h6>;
           });
        }

        let oldTags = this.state.tags;
        let oldTagsDropdown = [];

        if (oldTags !== undefined) {
            oldTagsDropdown = oldTags.map((tagName) => {
                return <Dropdown.Item onClick={() => this.handleInterestDeletion(tagName)}>
                {tagName}
            </Dropdown.Item>;
            });
        }
        
        let addedTagsDropdown = null;

        if(oldTagsDropdown.length === 0)
        {
            addedTagsDropdown = <h3>This spin doesn't have any associated tags.</h3>
        }
        else
        {
            // create a dropdown using those interests
            addedTagsDropdown = (
                <DropdownButton
                title='Remove from Existing Tags'
                variant='outline-danger'
                block
                className = "shareButtons"
                >
                    {oldTagsDropdown}
                </DropdownButton>
            );
        }

        return (
            <div className="spin-form">
                    <Form >
                        <Form.Label>Share Spin</Form.Label>
            
                        <Form.Control 
                            as = "textarea" 
                            placeholder="Your Spin here"
                            rows="3" 
                            onChange = {this.handleShareTextChange}
                        />
                            <p>{this.state.sharedSpinText.length}/90 characters</p>
                        
                        {addedTagsDropdown}

                        {this.state.tags.map(function(tagName, index) { 
                            return <span>{ ( index ? ', ' : '') + tagName}</span>;
                        })}

                    </Form>

                    <Form onSubmit = {this.handleNewTagAddition}>
                        <Form.Control
                            width = "40%"
                            placeholder = "Add new tag"
                            onChange = {this.handleNewTagTextChange}
                            value = {this.state.newTagText}
                            style = {{marginTop : "10px", marginBottom : "10px"}}
                        />
                        <div>
                            <Button variant = "outline-primary" type = "submit" style={{ display : "block", margin : "auto", marginBottom : "10px"}}>Add tag</Button>
                        </div>
                    </Form>


                <div className="modal-footer">
                    <Button variant = "outline-primary" className = "editButtons" onClick = {this.handleSharePostSubmission}>Share</Button>
                    <Button variant = "outline-primary" className = "editButtons" onClick={this.closeShareModal}>Cancel</Button>
                </div>
            </div>
    );
}


    openMoreTagsModal()
    {
        this.setState({showMoreTagsModal : true});
    }

    closeMoreTagsModal()
    {
        this.setState({showMoreTagsModal : false});
    }

    getModalTagViews()
    {
        return this.state.tags.map((tagName) => {
            if(this.state.viewingUserTags !== undefined && this.state.viewingUserTags.includes(tagName))
            {
                return <p tabIndex={0} className="followed-tags" onClick={() => this.unfollowTag(tagName)}>#{tagName}</p>;
            }
            else
            {
                return <p tabIndex={0} className="unfollowed-tags" onClick={() => this.followTag(tagName)}>#{tagName}</p>;
            }
        });
    }

    render()
    {
        // console.log("Editor bool: ", this.state.showEditer);
        // console.log("Author: ", this.author);
        // console.log("UserToView: ", this.userToView);
        let likeButton = null;
        let moreTagsButton = null;
        let share_button = null;
        let edit_button = null;
        let tagViewList = [];
        let delete_button = null;
        let flameIcon = null;

        if(this.state.hasNewTags)
        {
            flameIcon = <div>
                <Image src={Flame} style={{'display' : 'inline'}}/>
                <p style={{'display' : 'inline'}}>New topic!</p>
            </div>;
        }

        if(this.viewerIsAuthenticated())
        {
            if(this.state.showLike)
            {
                likeButton = <Button onClick={this.likeSpin} className="image-button-cover"><Image title = "Like spin" className="like-image" alt="like" src={LikeImage}/></Button>;
            }
            else
            {
                likeButton = <Button onClick={this.unlikeSpin} className="image-button-cover"><Image title = "Unlike spin" className="like-image" alt="unlike" src={unlikeImage}/></Button>;
            }

            if(this.state.tags.length === 0)
            {   
                tagViewList.push(<h6>No associated tags found.</h6>);
            }
            else
            {   
                let i = 0;
                
                while(i < MAX_TAGS && i < this.state.tags.length)
                {
                    let tagName = this.state.tags[i];
                    let view = null;

                    if (this.state.viewingUserTags !== undefined ) {
                        
                        if(this.state.viewingUserTags.includes(tagName))
                        {
                            view = <p tabIndex={0} className="followed-tags" onClick={() => this.unfollowTag(tagName)}>#{tagName}</p>;
                        }
                        else
                        {
                            view = <p tabIndex={0} className="unfollowed-tags" onClick={() => this.followTag(tagName)}>#{tagName}</p>;
                        }
                        tagViewList.push(view);
                    
                    } else {
                        view = <p tabIndex={0} className="unfollowed-tags" onClick={() => this.followTag(tagName)}>#{tagName}</p>;
                    }
                    i++;
 
                }

                if(this.state.tags.length > MAX_TAGS)
                {
                    moreTagsButton = <Button className="image-button-cover" onClick={this.openMoreTagsModal}><Image title = "Show all tags" alt="more_tags" src = {showMoreButton} className="more-tags-image" /></Button>;
                }
            }

            share_button = <Button className="image-button-cover"><Image title = "Share"
            className="share-image" 
            src={shareImage}
            onClick = {this.showShareModal}
            title = "Share"
            alt = "Share"
            // onClick = {this.askForConfirmation} TODO: Implement share (add this to button.)
            /></Button>


            if (this.author === this.userToView) {
                edit_button = <Button className="image-button-cover" onClick = {this.showEditModal}><Image title = "Edit"
                className="share-image" // using same properties
                src={editImage}
               
                alt = "Edit"
                /></Button>

                delete_button = <Button className="image-button-cover" onClick = {this.askForConfirmation}><Image title = "Delete"
                className="share-image" // using same properties
                src={deleteImage}
                onClick = {this.askForConfirmation}
                alt = "Delete"
                /></Button>
            }


        }

        let usernameLink  = `/profile/${this.props.username}`;
        let usernameField = <a href={usernameLink}>{this.props.username}</a>

        let speechText = this.props.username + " wrote:      " + this.state.content + "       ";
        if(this.state.tags.length > 0)
        {
            speechText += "  Added tags: ";
            for(let i = 0; i < this.state.tags.length; i++)
            {
                speechText += this.state.tags[i] + "       ";
            }
        } 
        
        var content = this.state.content;
        var urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

        var exp = urlRegex.exec(content);
        var url = '';
        if (exp && exp.length > 1)
        {
          url = exp[0];
          content = content.replace(url, "");
        }

        console.log('content =', content)

        return (
            <div className="spin-area">

                <div className="username-section">
                    <div className="username-link">
                        {usernameField}  
                    </div>
                    {flameIcon}
                    <div className="time-section">
                        <h6>
                            {this.formatDate(this.state.timestamp)}
                        </h6>
                    </div> 
                </div>
                <div className="spin-content">
                    <p> 
                      { content}
                      <a href={url}>{url}</a>
                    </p>
                </div>

                <div className="other-info">
                    {likeButton} 
                    <p className="num-likes">{this.state.likes} people like this</p>
                    {share_button}
                    {edit_button}
                    {delete_button}
                </div>
                <Speech text={speechText} textAsButton={true} displayText="Play audio"/>
                {this.state.quote}
                <div className="tags-container" style={tagContainerStyle}>
                    {tagViewList}
                    {moreTagsButton}
                </div>
                <Modal show = {this.state.showEditer}>
                    {this.renderEditForm()}
                </Modal>
                <Modal show = {this.state.showShare}>
                    {this.renderShareForm()}
                </Modal>

                <Modal  show={this.state.showMoreTagsModal}>
                    <div className = "moreTagsDiv">
                        {this.getModalTagViews()}
                    </div>
                    
                    <Button onClick={this.closeMoreTagsModal}>Close</Button>
                </Modal>
            </div>
        );
    }
}

Spin.propTypes = {
    username: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    spinID: PropTypes.number.isRequired,
    userToView: PropTypes.string.isRequired,
    tags: PropTypes.array.isRequired
}

export default Spin;
