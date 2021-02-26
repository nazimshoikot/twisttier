import React, {Component} from 'react';
import Feed from './feed.jsx';
import Spin from './spin.jsx';
import Profile from "./Profile.js";
import Error from './Error.js';
import Button from 'react-bootstrap/Button';
import { Dropdown, DropdownButton}  from 'react-bootstrap';
import Modal from './Modal.js';
import {NotificationManager} from 'react-notifications';
import "./userfeed.css";
import Speech from "react-speech";
import Form from 'react-bootstrap/Form';

var OperationEnum = {
    FOLLOW : 1,
    UNFOLLOW : 2
}

/**
 * UserFeed is the profile of a selected user.
 */
class UserFeed extends Component
{
    constructor(props)
    {
        super(props);
        this.username = this.props.match.params.username;
        this.state = {
            spins : [],
            interests : [],
            error : {
                exist : false, 
                message : "",
                status : ""
            },
            showFollowModal : false,
            //This is for the follow modal to keep track of the items selected.
            toFollowInterests : [],
            toUnfollowInterests : [],
            currentOperation : OperationEnum.FOLLOW,
            newSpins: [],
            spinModalShow: false,

            // for edit and follow/unfollow
            userToViewInterests : [],
            userToViewFollowing : [],
            spin : {
                text : "",
                chars : 0,
                interests : [],
            },
        }

        // functions
        this.onFollowPressed = this.onFollowPressed.bind(this);
        this.onActionPressedAtModal = this.onActionPressedAtModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.showModal = this.showModal.bind(this);
        this.updateTagData = this.updateTagData.bind(this);
        this.addInterestToFollowList = this.addInterestToFollowList.bind(this);
        this.addInterestToUnfollowList = this.addInterestToUnfollowList.bind(this);
        this.changeOperationState = this.changeOperationState.bind(this);
        this.getViewingUser = this.getViewingUser.bind(this);
        this.getUserInterestsAndFollowing = this.getUserInterestsAndFollowing.bind(this);

        this.onSpinPressed = this.onSpinPressed.bind(this);
        this.closeSpinModal = this.closeSpinModal.bind(this);
        this.showSpinModal = this.showSpinModal.bind(this);
        this.addInterestToSpin = this.addInterestToSpin.bind(this);
        this.handleSpinChange = this.handleSpinChange.bind(this);
        this.handleTag = this.handleTag.bind(this);
        this.handleTagChange = this.handleTagChange.bind(this);
        this.onSpinPressedAtModal = this.onSpinPressedAtModal.bind(this);

        this.userToView = this.getViewingUser();
    }

    updateUserSpins(username)
    {
        //Since "this" changes when you enter a new context, 
        //we have to keep the reference for using it inside fetch.
        const self = this;
        console.log("Fetching... ", `/api/posts/${username}`);
        fetch(`/api/posts/${username}`, {
            method: "POST",
            credentials: 'same-origin'
        }).then(function(res){
            // console.log(res);
            if(res.status === 200)
            {
                //res.json also is a promise thus we attach a success callback
                res.json().then(function(jsonData){
                    const dataDict = JSON.parse(jsonData);
                    console.log(jsonData);
                    self.setState({spins : dataDict.regularposts, newSpins: dataDict.newtagposts});
                }).catch(function(error){
                    self.setState({error:{exist:true, message:error, status:404}});
                });
                
            }
            else{
                self.setState({error: {exist: true, message: res.headers.error, status:res.status}});
                console.log(res.headers.error);
            }
        }).catch(function(err){
            console.log(err);
            self.setState({error: {exist: true, message: err, status:404}});
        });
    }

    checkUserFollowings()
    {
        let user = this.getViewingUser();
        if(user === null) return;

    }

    addInterestToSpin(interest) { //this needs an action listener
        let interestsList = this.state.spin.interests;
        if(!interestsList.includes(interest))
        {
        interestsList.push(interest);
        }
        
        // console.log(interestsList);
        let currentText = this.state.spin.text;
        let currentChar = this.state.spin.chars;
        this.setState({spin : {interests : interestsList, chars: currentChar, text : currentText}});
    }
    
    //when the spin text is changed, update the chars count
    handleSpinChange(event){
        let updatingText = event.target.value;
        if(event.target.value !== undefined && event.target.value.length > 90)
        {
            updatingText = updatingText.substring(0, 90);
        }
        this.setState({spin: {chars: updatingText.length, text: updatingText, interests : this.state.spin.interests}});
     }


    componentDidMount()
    {
        this.updateUserSpins(this.username);
        this.updateTagData();
        this.getUserInterestsAndFollowing();
    }

    onFollowPressed()
    {
        console.log("Follow pressed.");
        this.showModal();
    }

    getViewingUser()
    {
        if(document.cookie !== "")
        {
            return document.cookie.split('=')[1];
        }
        else return null;
    }

    getUserInterestsAndFollowing() {
        let self = this;
        fetch(`/api/users/${this.userToView}`, {
            method: 'POST'
        }).then(function(response){

                if (response.status === 200) {
                    response.json().then(function(data){
                    let jsonData = JSON.parse(data);
                    // console.log("user data: ", data);
                    let currentInterests = [];
                    
                    // fill current interests of the user
                    for (var i = 0; i < jsonData.tags_associated.length; i++) {
                        currentInterests.push(jsonData.tags_associated[i]);
                    }

                    // fill the following of the user
                    let userfollowing = jsonData.following.users;
                    // console.log("following: ", userfollowing);


                    self.setState({
                        userToViewInterests : currentInterests,
                        userToViewFollowing : userfollowing
                    });
                    
                })
            }
        })
    }

    /**
     * 
     * @param {*} operation string that is either "Follow" or "Unfollow" 
     */
    onActionPressedAtModal(operation)
    {

        let loggedInUser = this.getViewingUser();
        let chosenList = operation === "Follow" ? this.state.toFollowInterests : this.state.toUnfollowInterests;
        let self = this;
        if(loggedInUser === null) return;
        let jsonBody = {
            action : operation.toLowerCase(),
            toFollow : this.username,
            tags : chosenList,
            follower : loggedInUser
        };
        console.log(jsonBody);
        fetch("/api/updateFollowing", {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(jsonBody)
        }).then(function(res){
            if(res.status === 200)
            {
                NotificationManager.success(`${operation} successful!`);
                self.closeModal();
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

    showModal()
    {
        console.log("Showing modal...");
        this.setState({showFollowModal : true});
    }

    closeModal()
    {
        this.setState({showFollowModal : false, toFollowInterests : [], toUnfollowInterests : []});
    }

    changeOperationState(operation)
    {
        this.setState({currentOperation : operation});
    }

    onDropdownItemClicked(interest)
    {
        switch(this.state.currentOperation)
        {
            case OperationEnum.FOLLOW: this.addInterestToFollowList(interest); break;
            case OperationEnum.UNFOLLOW: this.addInterestToUnfollowList(interest); break;
            default: console.log("Error: unknown operation"); break;
        }
    }

    addInterestToFollowList(interest)
    {
        let interestList = this.state.toFollowInterests;
        if(!interestList.includes(interest))
        {
            interestList.push(interest);
            this.setState({toFollowInterests : interestList});
        }
    }

    addInterestToUnfollowList(interest)
    {
        let unfollowList = this.state.toUnfollowInterests;
        if(!unfollowList.includes(interest))
        {
            unfollowList.push(interest);
            this.setState({toUnfollowInterests : unfollowList});
        }
    }

    updateTagData()
    {
        let self = this;
        fetch(`/api/users/${this.username}`, {
            method : 'POST'
        }).then(function(response){
            if(response.status === 200)
            {
                response.json().then(function(data){
                    let jsonData = JSON.parse(data);
                    // console.log(data);
                    let currentInterests = [];
                    for(var i = 0; i < jsonData.tags_associated.length; i++)
                    {
                        currentInterests.push(jsonData.tags_associated[i]);
                    }
                    self.setState({interests : currentInterests});
                });
            }
        });

    }

    onSpinPressed() {
        this.showSpinModal();
    }

    showSpinModal()
    {
        this.setState({spinModalShow : true});
    }

    closeSpinModal()
    {
        setTimeout(function() {
            window.location.reload();
        }.bind(this), 900)
        this.setState({spinModalShow : false});
    }

    handleInterestDeletion(oldInterest) {

        let interestList = this.state.spin.interests;

        // find index of the tag
        let indexOfInterest = interestList.indexOf(oldInterest);

        // delete the tag
        if (indexOfInterest != -1) {
            interestList.splice(indexOfInterest, 1);
        }
        // reset the state
        this.setState({spin : {chars: this.state.spin.text.length, text: this.state.spin.text, interests : interestList}});
    }

    renderSpinForm() {
        let spinInterests = this.state.interests.map((tagName) => {
            if (!this.state.spin.interests.includes(tagName)) {
            return <Dropdown.Item onClick={() => this.addInterestToSpin(tagName)}>{tagName}</Dropdown.Item>
            }
        });
        let currentAddedInterestView = [];
        if (this.state.spin.interests !== undefined) {
            currentAddedInterestView = this.state.spin.interests.map((tagName) => {
                     return <Dropdown.Item onClick={() => this.handleInterestDeletion(tagName)}>        
                        {tagName}
                    </Dropdown.Item>;
                
            });
        }

        let addedDropdown = (
            <DropdownButton
            title='Remove from Existing Tags'
            variant='outline-danger'
            block
            className = "spinButtons"
            >
                {currentAddedInterestView}
            </DropdownButton>
        );

        let disableInterestDropdown = false;
        if (spinInterests.length === 0) {
            disableInterestDropdown = true;
        }

        let dropdownInterests = (
            <DropdownButton title='   Add from Existing Tags   '    variant='outline-success'   block   className = "spinButtons">
                {spinInterests}
            </DropdownButton>
        );

        let interestsDropdown = null;
        if (disableInterestDropdown){
            interestsDropdown = <h3>You need to add tags.</h3>
        } else {
            interestsDropdown = (<div>
                {dropdownInterests}
                {addedDropdown}
            </div>)
        }

        return (
            <div className="spin-form">
                    <Form >
                        <Form.Label>Spin</Form.Label>
                        <Form.Control as = "textarea" placeholder="Your Spin here" rows="3"
                            onChange = {this.handleSpinChange}/>
                            <p>{this.state.spin.chars}/90 characters</p>
                    </Form>
                    {interestsDropdown}
  
                    <Form onSubmit = {this.handleTag} >
                    <Form.Control 
                        width = "40%" 
                        placeholder = "Add new tag" 
                        onChange = {this.handleTagChange}/>
                        <Button className = "editButtons" variant = "outline-primary" type = "submit">Add tag</Button>
                    </Form>
                <div className="modal-footer">
                    <Button variant = "outline-primary" className = "editButtons" onClick={this.onSpinPressedAtModal}>Spin</Button>
                    <Button variant = "outline-primary" className = "editButtons" onClick={this.closeSpinModal}>Cancel</Button>
                </div>
            </div>

        );
    }

    onSpinPressedAtModal(event) {
        if(this.state.spin.chars <= 0 ){
            NotificationManager.error("Spin is too short!");
            return;
        } else if (this.state.spin.chars > 90) {
            NotificationManager.error("Spin is too long!");
            return;
        } else if (this.state.spin.interests === undefined || this.state.spin.interests.length <= 0) {
            NotificationManager.error("You must have a tag!");
            return;
        }

        else {
            let self = this;
            let body = {
                spinBody: this.state.spin.text,
                tags: this.state.spin.interests,
                is_quote: false,
            };
            fetch(`/api/add_spin/${this.username}`, {
                method : 'POST',
                headers : {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify(body)
            }).then(function(res){
                if(res.status === 200)
                {
                    NotificationManager.success("Spun!");                   
                    self.closeSpinModal();
                }
                else
                {
                    if(res.headers.has("error"))
                    {
                        NotificationManager.error(res.headers.get('error'));
                    }
                    else
                    {
                        NotificationManager.error("Server didn't return OK response.");
                    }                }
            });
           
        }
    }

    handleTagChange(event) {
        this.setState({tag : event.target.value});
    }

    handleTag(event){
        event.preventDefault();
        this.addInterestToSpin(this.state.tag);
    }

    renderFollowForm()
    {
        let currentOperationText = "Follow";
        switch(this.state.currentOperation)
        {
            case OperationEnum.FOLLOW: currentOperationText = "Follow"; break;
            case OperationEnum.UNFOLLOW: currentOperationText = "Unfollow"; break;
        }
        let stateDropdownView = <div>
            <h6>Current operation: {currentOperationText}</h6>
            <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                Operation
            </Dropdown.Toggle>
            <Dropdown.Menu>
                <Dropdown.Item onClick={() => this.changeOperationState(OperationEnum.FOLLOW)}>Follow</Dropdown.Item>
                <Dropdown.Item onClick={() => this.changeOperationState(OperationEnum.UNFOLLOW)}>Unfollow</Dropdown.Item>
            </Dropdown.Menu>
            </Dropdown>
        </div>;

        let followItems = this.state.interests.map((tagName) => {
            return <Dropdown.Item onClick={() => this.onDropdownItemClicked(tagName)}>{tagName}</Dropdown.Item>;
        });
        let disableTagDropdown = false;
        // console.log(followItems);
        if(followItems.length === 0)
        {
            disableTagDropdown = true;
        }

        let dropdownList = (
            <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                Tags
            </Dropdown.Toggle>

            <Dropdown.Menu>
                <div className = "more-tags-div">
                    {followItems}
                </div>
                
            </Dropdown.Menu>
            </Dropdown>
        );

        
        let chosenList = null;
        switch(this.state.currentOperation)
        {
            case OperationEnum.FOLLOW: chosenList = this.state.toFollowInterests; break;
            case OperationEnum.UNFOLLOW: chosenList = this.state.toUnfollowInterests; break;
            default: console.log("Error: operation not defined."); break;
        }
        let addedInterestList = chosenList.map((interest) => {
            return <p>{interest}</p>;
        });

        let addedListView = (
            <div>
            <h6>Interests you decided to {currentOperationText.toLowerCase()}:</h6>
            {addedInterestList}
            </div>
        );
        let dropdownListView = null;

        if(disableTagDropdown)
        {
            dropdownListView = <h4>The user doesn't follow any tags at the moment.</h4>;
        }
        else
        {
            dropdownListView = (<div>
                                    {dropdownList}
                                    {addedListView}
                                </div>);
        }
        
        return (
            <div className="follow-form">
                {stateDropdownView}
                <h3>Which tags you want to {currentOperationText.toLowerCase()} from the user?</h3>
                {dropdownListView}
                <div className="modal-footer">
                    <Button onClick={() => this.onActionPressedAtModal(currentOperationText)}>{currentOperationText}</Button>
                    <Button onClick={this.closeModal}> Cancel </Button>
                </div>
            </div>
        );
    }

    render()
    {
        //Right now we will use three parts of the spin.
        //content, username and timestamp.
        if(this.state.error.exist) {
            return <Error message={this.state.error.message} statusCode={this.state.error.status}/>
        }
        
        let feed = new Feed(this.username);
        if(this.state.spins != undefined && this.state.spins.length > 0) 
        {
            for(var i = 0; i < this.state.spins.length; i++)
            {
                var spin = this.state.spins[i];
                // console.log('spin =', spin);
                // console.log("user to view interests: ", this.state.userToViewInterests);
                // console.log("user to view following: ", this.state.userToViewFollowing);

                // find out the tags viewing user follows from the author of the spin
                var followingTagsForThisSpin = [];
                for (var j = 0; j < this.state.userToViewFollowing.length; j++) {
                    if (this.state.userToViewFollowing[j].username === spin.username) {
                        followingTagsForThisSpin = this.state.userToViewFollowing[j].tags;
                    }
                }
                // console.log(spin);
                feed.addSpin(<Spin username={spin.username} content={spin.content} 
                    timestamp={spin.date} spinID={spin.id} userToView={this.userToView} 
                    tags={spin.tags} likes={spin.likes} likeList={spin.like_list}
                    userInterests = {this.state.userToViewInterests}
                    tagsFollowedForThisSpin = {followingTagsForThisSpin}  quoted={spin.is_quote} quoteOrigin={spin.quote_origin}
                    />);
            }
        }
        else{
          feed.addSpin(<h6>This user currently has no spins 😢</h6>);
        }

        let followButton = null;
        let spinButton = null;
        let greeting = null;
        //If cookie is not empty, an authenticated user entered the page.
        if(document.cookie !== "")
        {
            followButton = <Button style={{marginTop : "10px", marginBottom : "10px"}} onClick={this.onFollowPressed}>Follow &amp; Unfollow Interests</Button>;
            if(this.getViewingUser() === this.username)
            {
                spinButton = <Button onClick={this.onSpinPressed}>Spin</Button>;
                greeting = <h4>Welcome to your profile!</h4>;
            }
        }

        let speechText = `You are right now in the profile of ${this.username}`;
        /**
         * The view organized by these parts:
         *          Page
         *  Left | Middle | Right
         */
        return (
            <div className="user-feed-page">
                <div className="user-feed-left">
                    <Speech text={speechText} textAsButton={true} displayText="Play audio"/>
                    <Profile username={this.username}/>
                    {followButton}
                    <Modal show={this.state.showFollowModal}>
                        {this.renderFollowForm()}
                    </Modal>
                </div>
                <div className="user-feed-middle">
                    {greeting}
                    {spinButton}
                    {feed.render()}
                </div>
                <Modal show={this.state.spinModalShow}>
                    {this.renderSpinForm()}
                </Modal>
            </div>
        );     

    }
} 

export default UserFeed;