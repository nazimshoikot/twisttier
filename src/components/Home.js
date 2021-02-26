import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from 'react-bootstrap/Nav';
import {
  Link
} from 'react-router-dom';
import './Home.css';


class Home extends Component{

    constructor(props)
    {
        super(props);
        this.state = {
            loggedIn : false,
            username : ""
        };  
    }

    componentDidMount()
    {
        //Decide which page to show.
        
    }

    render()
    {
        return (
            <div class = "centered">
                <Container>
                <Row>
                    <Col>
                    <h3>Welcome to Twister!</h3>
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <h4>Get swept up in the conversation.</h4>
                    </Col>
                </Row>  
                <Row>
                    <Col>
                        <Nav.Link>
                           <Link to = "/login"><Button variant="primary" style={{width : "100px"}}>Login</Button>
                           </Link> 
                        </Nav.Link> 
                    </Col>
                </Row>  
                <Row>
                <Col>
                        <Nav.Link>
                           <Link to = "/signup"><Button variant="secondary" style={{width : "100px"}}>Sign up</Button>
                           </Link> 
                        </Nav.Link> 
                    </Col>
                </Row>    
                </Container>

            </div>
        );
    }
}

export default Home;
