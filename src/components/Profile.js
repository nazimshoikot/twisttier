import React, {Component} from 'react';
import "./profile.css";
import {NotificationManager} from 'react-notifications';
import defaultPic from "./profilepicIcon.png";
import Modal from "./Modal";
import Button from "react-bootstrap/Button";
import Speech from "react-speech";

const imgScale = {
    "height" : "100%",
    "width" : "100%"
}

/**
 * The profile component.
 * Has three seperated parts:
 *  -Basic user information
 *  -Following and Follower List
 *  -Interest List
 */
class Profile extends Component{

    constructor(props)
    {
        super(props);
        this.username = this.props.username;
        this.defaultProfileView = (<div>
                                <img src={defaultPic} alt={this.username} style={imgScale}/>
                            </div>);

        this.state = {
            profilePicLink : "",
            profilePic : '',
            username : this.props.username,
            following: [],
            followers: [],
            followerListShow : false,
            followingListShow : false,
            bio : "",
            interests : [],
            //This is state to keep track whether the mouse cursor is on top of a username.
            //usernameHover : false
        };

        //This will contain the hovered users followed or following tags.
        this.currentHoverView = null;

        this.renderFollowersFollowingList = this.renderFollowersFollowingList.bind(this);
        this.showUserList = this.showUserList.bind(this);
        this.openFollowerModal = this.openFollowerModal.bind(this);
        this.openFollowingModal = this.openFollowingModal.bind(this);
        this.closeFollowerModal = this.closeFollowerModal.bind(this);
        this.closeFollowingModal = this.closeFollowingModal.bind(this);
    }

    componentDidMount()
    {
        //Since "this" changes when you enter a new context, we have to keep the reference for using it inside fetch.
        const self = this;
        // console.log(`/api/users/${self.username}`);
        fetch(`/api/users/${self.username}`, {
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

                // console.log("This is the json data: ", jsonData);
                let chosenProfilePic = self.defaultProfileView;
                //If link is not empty
              if (dataDict.profile_pic !== "" && dataDict.profile_pic != null)
                {

                  fetch(dataDict.profile_pic).then(function(res)
                  {

                    if(res.status === 200)
                    {
                      self.state.profilePicLink = res.url;

                        chosenProfilePic = (<div>
                        <img src={self.state.profilePicLink} alt={self.state.username} style={imgScale}/>
                          </div>);

                    }
                    self.setState({ profilePic: chosenProfilePic });
                  });
                }
                else
                {
                  self.setState({ profilePic: chosenProfilePic });

                }
              self.setState({ bio: dataDict.bio, interests: dataDict.interests, following: dataDict.following.users, followers: dataDict.followers});


              }).catch(function(error){
                  self.setState({error:{exist:true, message:error, status:404}});
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

    /**
     * Returns the list of anchor tags with the link of the user's profiles given a list of usernames.
     * @param {*} userList List of usernames.
     */
    showUserList(userList)
    {
      // console.log(userList);
      //The user list has entries (username, tags).
      let userListView = userList.map((entry) => {
        return (
          <UsernameListEntry entry={entry}/>
        );
      });
      // console.log(userListView);
      return userListView;
    }

    openFollowerModal()
    {
      this.setState({followerListShow : true});
    }

    openFollowingModal()
    {
      this.setState({followingListShow : true});
    }

    closeFollowerModal()
    {
      this.setState({followerListShow : false});
    }

    closeFollowingModal()
    {
      this.setState({followingListShow : false});
    }

    renderFollowersFollowingList()
    {
      let followerListButton = <Button style={{display : "inline-block", marginRight : "10px", marginLeft : "10px", marginBottom : "10px"}} onClick={this.openFollowerModal}>{this.state.followers.length} Followers</Button>;
      let followingListButton = <Button style={{display : "inline-block", marginRight : "10px", marginLeft : "10px", marginBottom : "10px"}} onClick={this.openFollowingModal}>{this.state.following.length} Following</Button>;

      return (
        <div className="follow-info-container">
          <div className="follower-list">
            {followerListButton}
            <Modal show={this.state.followerListShow}>
              {this.showUserList(this.state.followers)}
              <Button onClick={this.closeFollowerModal}>Close</Button>
            </Modal>
          </div>
          <div className='following-list'>
            {followingListButton}
            <Modal show={this.state.followingListShow}>
                {this.showUserList(this.state.following)}
                <Button onClick={this.closeFollowingModal}>Close</Button>
            </Modal>
          </div>
        </div>
      );
    }

    changeDescription(desc)
    {
        this.setState({bio : desc})
    }

    addTag(tag)
    {
        let updatedList = this.state.tags.push(tag);
        this.setState({tags : updatedList});
    }

    render()
    {
        //console.log("Rednginering Profile.");
        let tagViews = [];
        var followinglist = [];
        let speechText = `Details of user ${this.username}: Bio: ${this.state.bio}`
        // console.log('interests =', this.state.interests);
        // console.log('following =', this.state.following);
        if(this.state.interests != undefined && this.state.interests.length > 0)
        {
            let currentTags = this.state.interests;
            speechText += `Interests:   `;
            for(var i = 0; i < currentTags.length; i++)
            {
                tagViews.push(<h6 className="tag-entry">{currentTags[i]}</h6>);
                speechText += `${currentTags[i]}   `;
            }
        }
        else
        {
          tagViews.push(<h6 className="tag-entry">I have no interests 😢 Life is meaningless without interests</h6>);
          speechText += `I have no interests 😢 Life is meaningless without interests`;
        }

        var userLinkToProfile = `/profile/${this.username}`;

        return (
            <div className="profile-container">
                <div className="profile-info">
                    <a href = {userLinkToProfile}><h3>{this.state.username}</h3></a>
                    <h6>{this.state.bio}</h6>
                    {this.state.profilePic}
                </div>
                <div className="tag-info">
                    <h4>My interests</h4>
                    <div className="tag-list">
                        {tagViews}
                    </div>
                </div>
                {this.renderFollowersFollowingList()}
                <Speech text={speechText} textAsButton={true} displayText="Play audio"/>
            </div>
        );
    }



}

/*Helper components for profile.*/

/**
 * Username entry in the follower-following list.
 * Props:
 * entry : A map entry that has the structure: (username, tags).
 */
class UsernameListEntry extends Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      hover : false
    };
    var entry = this.props.entry;
    var username = entry;
    var tags = [];
    if (entry.username != undefined && entry.tags != undefined)
    {
      username = entry.username;
      tags = entry.tags;
    }
    this.username = username;
    this.tags = tags;
  }

  render()
  {
    let userLink = `/profile/${this.username}`;
    //Building a string in form of "tag1, tag2, tag3 ..., tagn".
    let tagList = [];

    if (this.tags !== undefined)
    {
      for(let i = 0; i < this.tags.length; i++)
      {
        if(i == this.tags.length - 1)
        {
          if(this.tags[i] !== undefined && this.tags[i] !== null)
          {
            tagList.push(this.tags[i]);
          }

        }
        else
        {
          if(this.tags[i] !== undefined && this.tags[i] !== null)
          {
            tagList.push(this.tags[i] + ',');
          }
        }
      }
    }


    let tagView = tagList.join("");

    let hoverView = null;
    if(this.state.hover)
    {
      if(tagView.length > 0)
      {
        hoverView = (
          <div className="hover-tag-view">
                {tagView}
          </div>
          );
      }
      else
      {
        hoverView =(
          <div className="hover-tag-view">
                Every tag
          </div>
          );
      }
    }
    /*OnMouseEnter and OnMouseLeave are events to catch hovering. When the username is hovered, we want to show the list of tags being followed or following.*/
    return (
      <div className="user-list-view">
      <a href={userLink} onMouseEnter={() => this.setState({hover : true})} onMouseLeave={() => this.setState({hover : false})}>
        <h4>{this.username}</h4></a>
        {hoverView}
      </div>
    );
  }
}

export default Profile;
