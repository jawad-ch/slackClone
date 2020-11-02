import React, { Component } from 'react'
import { Grid, Header, Icon, Dropdown, Image, Modal, Button, Input } from 'semantic-ui-react';
import { Auth, firebase, DB } from '../../firebase';
import AvatarEditor from 'react-avatar-editor';

class UserPanel extends Component {

    state = {
        user : this.props.currentUser,
        modal: false,
        previewImage: '',
        cropprdImage: '',
        blob:'',
        uploadedCroppedImage:'',
        storageRef: firebase.storage().ref(),
        userRef: Auth.currentUser,
        usersRef: DB.ref('users'),
        metadata: {
            contentType: 'image/jpeg'
        }
    }

    openModal = () => this.setState({modal:true})
    closeModal = () => this.setState({modal:false})

    dropdownOptions = () =>[
        {
            key:'user',
            text: <span>signed in as <strong>{this.state.user.displayName}</strong></span>,
            disabled: true
        },
        {
            key:'avatar',
            text: <span onClick={this.openModal}>Change Avatar</span>,
        },
        {
            key:'signedOut',
            text: <span onClick={this.handelSignOut}>Sign Out</span>,
        },
    ]

    handelSignOut = () =>{
        Auth.signOut().then(() =>{
            console.log('signOut :!!')
        })
    }
    handelChange = e =>{
        const file = e.target.files[0];
        const reader = new FileReader();
        if (file) {
            reader.readAsDataURL(file);
            reader.addEventListener('load', () => {
                this.setState({ previewImage: reader.result });
            })
        }
    }

    handelCropImage = () => {
        if (this.avatarEditor) {
            this.avatarEditor.getImageScaledToCanvas()
            .toBlob(blob => {
                let imageUrl = URL.createObjectURL(blob);
                this.setState({
                    cropprdImage: imageUrl,
                    blob
                })
            })
        }
    }

    uploadCroppedImage = () =>{
        const { storageRef, userRef, blob, metadata } = this.state;
        storageRef
        .child(`avatars/users/${userRef.uid}`)
        .put(blob, metadata)
        .then(snap =>{
            snap.ref.getDownloadURL().then(downloadURL =>{
                this.setState({ uploadedCroppedImage: downloadURL}, () => this.changeAvatar())
            })
        })
    }

    changeAvatar = () =>{
        this.state.userRef.updateProfile({
            photoURL: this.state.uploadedCroppedImage
        }).then(() =>{
            console.log('PhotoURL updated');
            this.closeModal();
        }).catch(err =>{
            console.log('err ::', err)
        })

        this.state.usersRef
        .child(this.state.user.uid)
        .update({ avatar: this.state.uploadedCroppedImage })
        .then(() => {
            console.log('user avatar updated')
        }).catch(err =>{
            console.log('err', err)
        })
    }

    render() {
        const { user, modal, previewImage, cropprdImage} = this.state;
        const {primaryColor} = this.props;
        return (
            <Grid style={{background: primaryColor}}>
                <Grid.Column>
                    <Grid.Row style={{padding:'1.2em', margin:0}}>
                        <Header inverted floated='left' as='h2'>
                            <Icon name='slack hash' style={{color: '#E01E5A'}} />
                            <Header.Content>
                                slack
                            </Header.Content>
                        </Header>
                        {/* user DropDown */}
                        <Header style={{padding:'0.25em'}} as='h4' inverted>
                            <Dropdown 
                            trigger={
                                <span>
                                    <Image src={user.photoURL} spaced='right' avatar/>
                                    {user.displayName}
                                </span>
                            } 
                            options={this.dropdownOptions()} 
                            />
                        </Header>
                    </Grid.Row>
                    {/* change user avatar */}

                    <Modal basic
                        open={modal}
                        onClose={this.closeModal} >
                        <Modal.Header>Change Avatar</Modal.Header>
                        <Modal.Content>
                            <Input
                              onChange={this.handelChange}
                              fluid
                              type="file"
                              label="New Avatar"
                              name="previewImage"
                            />
                            <Grid centered stackable columns={2}>
                                <Grid.Row centered>
                                    <Grid.Column className="ui center aligned grid">
                                        {previewImage && (
                                            <AvatarEditor
                                              ref={node => (this.avatarEditor = node)}
                                              image={previewImage}
                                              width={120}
                                              height={120}
                                              border={50}
                                              scale={1.2}
                                            />
                                        )}
                                    </Grid.Column>
                                    <Grid.Column>
                                        {cropprdImage && (
                                            <Image 
                                            src={cropprdImage}
                                            style={{margin: '3.5em auto'}}
                                            width={100}
                                            height={100}
                                            />
                                        )}
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Modal.Content>
                        <Modal.Actions>
                        {cropprdImage && (<Button 
                            color="green" 
                            inverted 
                            onClick={this.uploadCroppedImage}
                            >
                                <Icon name="checkmark" /> Change avatar
                            </Button>)}
                            <Button color="blue" inverted onClick={this.handelCropImage}>
                                <Icon name="image" /> Preview
                            </Button>
                            <Button onClick={this.closeModal} color="red" inverted>
                                <Icon name="remove" /> Cancel
                            </Button>
                        </Modal.Actions>
                    </Modal>
                </Grid.Column>
            </Grid>
        )
    }
}

export default UserPanel;