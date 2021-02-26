import React, {Component} from 'react';
import Feed from './feed.jsx';
import Spin from './spin.jsx';
import Profile from "./Profile.js";
import Form from 'react-bootstrap/Form';
import Error from './Error.js';
import Button from 'react-bootstrap/Button';
import Modal from './Modal.js';
import { NotificationManager } from 'react-notifications';
import { Dropdown, DropdownButton} from 'react-bootstrap';
import Speech from 'react-speech';


/**
 * UserFeed is the profile of a selected user.
 */
class Timeline extends Component
{
    constructor(props)
    {
        super(props);
        
        this.username = this.props.username;
        this.state = {
            tag : "",
            spins : [],
            newSpins : [],
            interests : [],
            error : {
                exist : false,
                message : "",
                status : ""
            },
            showSpinModal : false,
            spin : {
                text : " ",
                chars : 0,
                interests : [],
            },
            following : []
        };

        // functions
        this.onSpinPressed = this.onSpinPressed.bind(this);
        this.onSpinPressedAtModal = this.onSpinPressedAtModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.showModal = this.showModal.bind(this);
        this.addInterestToSpin = this.addInterestToSpin.bind(this);
        this.handleSpinChange = this.handleSpinChange.bind(this);
        this.handleTag = this.handleTag.bind(this);

        // console.log(this.username);
    }

    componentDidMount()
    {

        this.getUserInterests();
        const self = this;
        fetch(`/api/timeline/${this.username}`, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json"
            }
        }).then(function(res){
            if(res.status === 200)
            {
                res.json().then(function(jsonData){
                    const dataDict = JSON.parse(jsonData);
                    self.setState({spins : dataDict.regularposts, newSpins: dataDict.newtagposts});
                });
            }
            else{
                self.setState({error: {exist: true, message: res.headers.error, status:res.status}});
            }
        }).catch(function(err){
            self.setState({error: {exist: true, message: err, status:"404"}});
        });
    }

    handleTagChange(event) {
        this.setState({tag : event.target.value});
    }

    handleTag(event){
        event.preventDefault();
        this.addInterestToSpin(this.state.tag);
    }

    onSpinPressed() {
        console.log("Spin pressed.");
        this.showModal();
    }

    showModal() {
        console.log("Showing spin modal...");
        this.setState({showSpinModal : true})
    }

    closeModal() {
        console.log("Closing spin modal...");
        setTimeout(function() { //Start the timer
            window.location.reload();
        }.bind(this), 900)
        this.setState({showSpinModal : false});
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
                    self.closeModal();
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

    //when the spin text is changed, update the chars count
    handleSpinChange(event){
        let updatingText = event.target.value;
        if(event.target.value !== undefined && event.target.value.length > 90)
        {
            updatingText = updatingText.substring(0, 90);
        }
        this.setState({spin: {chars: updatingText.length, text: updatingText, interests : this.state.spin.interests}});
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

    getUserInterests() {
        let self = this;
        fetch(`/api/users/${this.username}`, {
            method: 'POST'
        }).then(function(response){
                if (response.status===200) {
                    response.json().then(function(data){
                    let jsonData = JSON.parse(data);
                    console.log("user data: ", data);
                    let currentInterests = [];
                    // fill current interests of the user
                    for (var i = 0; i < jsonData.tags_associated.length; i++) {
                        currentInterests.push(jsonData.tags_associated[i]);
                    }

                    // fill the following of the user
                    let userfollowing = jsonData.following.users;
                    console.log("following: ", userfollowing);


                    self.setState({
                        interests : currentInterests,
                        following : userfollowing
                    });
                    
                })
            }
        })
    }

    handleInterestDeletion(oldInterest) {

        let interestList = this.state.interests;

        // find index of the tag
        let indexOfInterest = interestList.indexOf(oldInterest);

        // delete the tag
        if (indexOfInterest != -1) {
            interestList.splice(indexOfInterest, 1);
        }
        // reset the state
        this.setState({
            interests : interestList
        });
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
            className = "shareButtons"
            >
                {currentAddedInterestView}
            </DropdownButton>
        );

        let disableInterestDropdown = false;
        if (spinInterests.length === 0) {
            disableInterestDropdown = true;
        }

        let dropdownInterests = (
            <DropdownButton
            title='   Add from Existing Tags   '
            variant='outline-success'
            block
            className = "editButtons"
        >
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
                    <Form onSpin = {this.handleSpin} >
                        <Form.Label>Spin</Form.Label>
                        <Form.Control 
                            as = "textarea" 
                            placeholder="Your Spin here" 
                            rows="3"
                            onChange = {this.handleSpinChange}
                        />
                            <p>{this.state.spin.chars}/90 characters</p>
                        </Form>
                        {interestsDropdown}

                    <Form onSubmit = {this.handleTag} >
                    <Form.Control width = "40%" placeholder = "Add new tag" onChange = {this.handleTagChange.bind(this)}/>
                        <Button className = "editButtons" variant = "outline-primary" type = "submit">Add new tag</Button>
                    </Form>
                <div className="modal-footer">
                    <Button variant = "outline-primary" className = "editButtons" onClick={this.onSpinPressedAtModal}>Spin</Button>
                    <Button variant = "outline-primary" className = "editButtons" onClick={this.closeModal}>Cancel</Button>
                </div>
            </div>

        );
    }

    render()
    {
        // console.log("state following: ", this.state.following);
        //Right now we will use three parts of the spin.
        //content, username and timestamp.
        if(this.state.error.exist) {
            return <Error message={this.state.error.message} statusCode={this.state.error.status}/>
        }
        let feed = new Feed(this.props.username);
        if(this.state.newSpins !== undefined && this.state.newSpins.length > 0)
        {
            for(var i = 0; i < this.state.newSpins.length; i++)
            {
                var spin = this.state.newSpins[i];
                if(spin.username !== this.props.username)
                {
                    feed.addSpin(<Spin username={spin.username} content={spin.content}
                        timestamp={spin.date} spinID = {spin.id}
                        userToView={this.username} tags={spin.tags}
                        likes= {spin.likes} likeList = {spin.like_list}
                        userInterests = {this.state.interests} hasNewTags={true} quoted={spin.is_quote} quoteOrigin={spin.quote_origin}
                    />);
                }
            }
        }
        if(this.state.spins !== undefined && this.state.spins.length > 0)
        {
            for(var i = 0; i < this.state.spins.length; i++)
            {   
                var spin = this.state.spins[i];

                // find the list of followed tags for the author of the spin
                var followingTagsForThisSpin = [];
                for (var j = 0; j < this.state.following.length; j++) {
                    if (this.state.following[j].username === spin.username) {
                        followingTagsForThisSpin = this.state.following[j].tags;
                    }
                }
                // console.log("Author: ", spin.username);
                // console.log("tags to send: ", followingTagsForThisSpin);

         
                if(spin.username !== this.props.username && !this.state.newSpins.includes(spin)) //Filter out spins that the user made.
                {
                  feed.addSpin(<Spin username={spin.username} content={spin.content}
                      timestamp={spin.date} spinID = {spin.id}
                      userToView={this.username} tags={spin.tags}
                      likes= {spin.likes} likeList = {spin.like_list}
                      userInterests = {this.state.interests} 
                      tagsFollowedForThisSpin = {followingTagsForThisSpin} quoted={spin.is_quote} quoteOrigin={spin.quote_origin}
                  />);
                }
                
            }
        }
        else{
            feed.addSpin(<h6>Follow user-tags to see spins here!</h6>);
        }

        let spinButton = <Button onClick={this.onSpinPressed}>Spin</Button>;

        let speechText = "You are right now in your timeline.";

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
                </div>

                <div className="user-feed-middle">
                    <h4>Hello {this.username}!</h4>
                    {spinButton}
                    {feed.render()}
                    <footer>
                        <div>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
                    </footer>
                    <Modal show={this.state.showSpinModal}>
                        {this.renderSpinForm()}
                    </Modal>
                </div>
            </div>
        );

    }
}

export default Timeline;
