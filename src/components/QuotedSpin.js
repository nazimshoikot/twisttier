import React from 'react';
import { Component } from 'react';
import Button from 'react-bootstrap/Button';
import './quotedspin.css';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css' // Import css
import Modal from './Modal.js';
import LikeImage from './like.png';
import unlikeImage from './unlike.png';
import Image from 'react-bootstrap/Image';
import showMoreButton from "./showMore.png";
import Speech from "react-speech";
import Flame from "./flame.png";

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
 * The quoted spin component that displays username, message content and user timestamp. It is immutable, there is no state.
 */
class QuotedSpin extends Component
{
    constructor(props)
    {
        super(props);

        this.quoted = this.props.quoted || false; 
    }

    // checks whether viewer is logged in or nor
    viewerIsAuthenticated()
    {
        return document.cookie !== "";
    }

    // formats the date
    formatDate(timestamp)
    {
      if (timestamp === '-deleted-')
      {
        return timestamp;
      }
      let dateAndTime = timestamp.split('T');
      let time = dateAndTime[1].substring(0, 5);
      return dateAndTime[0] + " " + time;
    }

    render()
    {
        let usernameLink  = `/profile/${this.props.username}`;
        let usernameField = <a href={usernameLink}>{this.props.username}</a>

        let speechText = this.props.username + " wrote:      " + this.props.content + "       ";
        if(this.props.tags && this.props.tags.length > 0)
        {
            speechText += "  Added tags: ";
            for(let i = 0; i < this.props.tags.length; i++)
            {
                speechText += this.props.tags[i] + "       ";
            }
        } 
        
        let timeField = this.formatDate(this.props.timestamp);
        let likesField = `${this.props.likes} people liked this`;
        if (this.props.username === '-deleted-') {
            speechText = "This spin was deleted."
            usernameField = null;
            timeField = null;
            likesField = null;
        }

        return (
            <div className="quoted-spin-area">

                <div className="quoted-username-section">
                    <div className="quoted-username-link">
                        {usernameField}  
                    </div>
                    <div className="quoted-time-section">
                        <h6>
                            {timeField}
                        </h6>
                    </div> 
                </div>
                <div className="quoted-spin-content">
                    <p>
                        {this.props.content}
                    </p>
                </div>

                <div className="quoted-other-info">
                    <p className="quoted-num-likes">{likesField}</p> 
                </div>
                <Speech text={speechText} textAsButton={true} displayText="Play audio"/>
            </div>
        );
    }
}

export default QuotedSpin;