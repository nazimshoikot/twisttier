import React, {Component} from 'react';
import PropTypes from 'prop-types';


const modalStyle = {
  backgroundColor: 'rgb(165,165,165)',
  borderRadius: 5,
  top: "25%",
  bottom: "25%",
  left: "25%",
  right: "25%",
  maxWidth: 500,
  minHeight: 300,
  margin: 'auto',
  padding: 30,
  color: "black",
  zIndex : 100,
  maxHeight: "650px"
};

const backdropStyle = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0,0,0,0.3)',
  padding: 50
};

/**
 * Modal component for opening up dialogs.
 * This class is inspired by this post: https://daveceddia.com/open-modal-in-react/
 */

class Modal extends Component
{
    render()
    {

        if(!this.props.show)
        {
            return null;
        }

        // console.log("Rendering modal");
        return (
            <div className="backdrop" style={backdropStyle}>
              <div className="custom-modal" style={modalStyle}>
                {this.props.children}
              </div>
            </div>
          );
    }
}

//Declaring the types of props for error checking.
Modal.propTypes = {
    show: PropTypes.bool,
    children: PropTypes.node
}

export default Modal;
