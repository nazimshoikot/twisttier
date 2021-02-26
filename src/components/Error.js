import React, {Component} from 'react';

const textStyle = {
    display: "block"
};

class Error extends Component {

    constructor(props)
    {
        super(props);
    }
    render()
    {
        return (
            <div>
                <h1 style={textStyle}>{this.props.message}</h1>
                <h3 style={textStyle}>Status Code: {this.props.statusCode}</h3>
            </div>
        );
    }
}

export default Error;