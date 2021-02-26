import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import { Link } from 'react-router-dom'
import Image from 'react-bootstrap/Image'
import icon_settings from './settingsIcon.png'
import icon_home from  './homeIcon.png'
import icon_twister from './twisterIcon.png'
import { withRouter } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';

const toggleCSS = {
  margin : "5px"
};

class Navbardemo extends Component {
  constructor(props)
  {
    super(props);

    this.state = {
      searchValue : "",
      redirectToSearch : false
    }

    this.logOut = this.logOut.bind(this);
    this.onLogoutClicked = this.onLogoutClicked.bind(this);

    // search bar functions
    this.handleSearchValueChange = this.handleSearchValueChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

logOut()
  {
    fetch("/logout").then(function(res){
      if(res.status === 200)
      {
        NotificationManager.success("Logout successful");
        document.cookie = ""; //Clear cookies.
        window.location.reload();
      }
      else
      {
        if(res.headers.has('error'))
        {
          NotificationManager.error(res.headers['error']);
        }
        else
        {
          NotificationManager.error("Unexpected error occured.");
        }
      }
    });
}

onLogoutClicked()
{
  this.logOut();
}

handleSearchValueChange(event) {
  event.preventDefault();
  this.setState({
      searchValue : event.target.value
  })
}

// change the redirect bool
handleSearch(event) {
    // console.log("handling search");
    event.preventDefault();

    if (this.state.searchValue === "") {
      NotificationManager.error("Type in the searchbox before searching");
    } else {
      let url = "/searchUser/" + this.state.searchValue;
      this.props.history.push(url);

      // routing does not rerender. So force reload the page
      window.location.reload();
    }

  }


// render component
render() {
    let dynamicView = null;
    let user = this.props.username;
    if(this.props.loggedIn)
    {
      let prof = "/profile/" + user;

      dynamicView = (
        <div>
          <a href={prof}>
                <Image src={icon_home}  className='icon'/>
          </a>
            <Link to="/userSettings">
              <Image src={icon_settings}  className='icon' />
            </Link>


            <Button variant="outline-success" onClick={this.onLogoutClicked}>Logout</Button>
        </div>
      );
    }
    else
    {
      dynamicView = <Button variant="outline-success" onClick={() => this.props.history.push("/login")}>Login</Button>
    }

    return (
      <div>
        <Navbar expand="sm">
          <Link to="/">
            <Image src={icon_twister} className='icon'/>
          </Link>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">

            <Nav className="ml-auto">
                

                <Form inline onSubmit = {this.handleSearch}>
                  <dark-mode-toggle
                    id="dark-mode-toggle"
                    light="Light"
                    dark="Dark"
                    appearance="toggle"
                    permanent="false"
                    style = {toggleCSS}
                  ></dark-mode-toggle>
                  <FormControl
                    placeholder="Search"
                    value = {this.state.searchValue}
                    onChange = {this.handleSearchValueChange}
                  />

                  <Button
                    variant="outline-success"
                    onClick = {this.handleSearch}
                    style = {{marginRight : '10px', marginLeft : '10px'}}
                  >
                      Search
                  </Button>
                  {dynamicView}
                </Form>
              
            </Nav>


          </Navbar.Collapse>
        </Navbar>
      </div>
    )
  }
}
export default withRouter(Navbardemo);
