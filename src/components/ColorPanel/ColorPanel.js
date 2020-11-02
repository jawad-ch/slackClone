import React, { Component, Fragment } from 'react'
import { Sidebar, Divider, Menu, Button, Modal, Icon, Label, Segment } from 'semantic-ui-react';
import { SliderPicker } from 'react-color';
import { DB } from "../../firebase";
import { connect } from 'react-redux';
import { setColors } from "../../actions";

class ColorPanel extends Component {

    state = {
        modal: false,
        primary: '',
        secondary: '',
        usersRef : DB.ref("users"),
        user: this.props.currentUser,
        userColors: []
    };

    componentDidMount (){
        if (this.state.user) {
            this.addListener(this.state.user.uid)
        }
    }

    componentWillUnmount () {
        this.removeListener();
    }

    removeListener = () =>{
        this.state.usersRef.child(`${this.state.user.uid}/colors`).off();
    }

    addListener = userId =>{
        let userColors = [];
        this.state.usersRef
            .child(`${userId}/colors`)
            .on('child_added', snap =>{
                userColors.unshift(snap.val());
                this.setState({
                    userColors
                })
            })
    }

    displayUserColors = colors =>(
        colors.length > 0 && colors.map((color, index) =>(
            <Fragment key={index}>
                <Divider/>
                <div 
                  className="color__container"
                  onClick={() => this.props.setColors(color.primary, color.secondary)}
                >
                    <div className="color__square" style={{background: color.primary}}>
                        <div className="color__overlay" style={{background: color.secondary}}></div>
                    </div>
                </div>
            </Fragment>
        ))
    )

    openModal = () => this.setState({modal:true})
    closeModal = () => this.setState({modal:false})


    handelChangePrimary = color => this.setState({primary:color.hex})
    handelChangeSecondary = color => this.setState({secondary:color.hex})
    
    handelSaveColors = () => {
        if (this.state.primary && this.state.secondary) {
            this.saveColors(this.state.primary, this.state.secondary);
        }
    }
    saveColors = (primary, secondary) => {
        this.state.usersRef
        .child(`${this.state.user.uid}/colors`)
        .push()
        .update({
            primary,
            secondary
        }).then(()=>{
            console.log('color added')
            this.closeModal();
        }).catch(err =>{
            console.log('err ::', err)
        })
    }

    render() {

        const { modal, primary, secondary, userColors } = this.state;

        return (
          <Sidebar
          as={Menu}
          icon="labeled"
          inverted
          vertical
          visible
          width="very thin"
          >
            <Divider/>
            <Button icon='add' size="small" color="blue" onClick={this.openModal}/>
            {this.displayUserColors(userColors)}
            <Modal
                basic
                open={modal}
                onClose={this.closeModal}
            >
                <Modal.Header>Choose App Color</Modal.Header>
                <Modal.Content>
                    <Segment inverted>
                        <Label content="Primary Color"/>
                        <SliderPicker color={primary} onChange={this.handelChangePrimary} />
                    </Segment>
                    <Segment inverted>
                        <Label content="Secondary Color"/>
                        <SliderPicker color={secondary} onChange={this.handelChangeSecondary} />
                    </Segment>
                </Modal.Content>
                <Modal.Actions>
                    <Button color="green" inverted onClick={this.handelSaveColors}>
                        <Icon name="checkmark" /> Save colors
                    </Button>
                    <Button onClick={this.closeModal} color="red" inverted>
                        <Icon name="remove" /> Cancel
                    </Button>
                </Modal.Actions>
            </Modal>

          </Sidebar>  
        );
    }
}

export default connect(null, { setColors })(ColorPanel);