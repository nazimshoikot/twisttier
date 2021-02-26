import React, {Component} from 'react';
import Spin from './spin.jsx';
import './feed.css';
import {NotificationManager} from 'react-notifications';

/**
 * Feed component.
 * Props: viewingUser: user that is viewing the feed.
 */
class Feed extends Component
{
    constructor(props)
    {
        super(props);
        this.state =  {
            spins : [],
        };
    }

    addSpin(spin)
    {
        let updatedList = this.state.spins.push(spin);
        this.setState({spins: updatedList});
    } 

    render() 
    {
        return (
            <div className="feed-area">
                {this.state.spins}
            </div>
        );
    }
}

export default Feed;