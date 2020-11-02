import React, { Component } from 'react'
import { Segment, Input, Button } from 'semantic-ui-react';
import { firebase, DB } from '../../firebase';
import FileModal from './FileModal';
import { v4 as uuidv4 } from 'uuid';
import ProgressBar from './ProgressBar';
import { Picker, emojiIndex } from 'emoji-mart'

import 'emoji-mart/css/emoji-mart.css'

class MessagesForm extends Component {

    state = {
        storageRef: firebase.storage().ref(),
        typingRef: DB.ref('typing'),
        uploadTask: null,
        uploadState: "",
        percentUploaded: 0,
        message: "",
        channel: this.props.currentChannel,
        user: this.props.currentUser,
        loading: false,
        errors: [],
        modal: false,
        emojiPicker: false
      };
    
      componentWillUnmount () {
        if (this.state.uploadTask !== null) {
          this.state.uploadTask.cancel();
          this.setState({ uploadState: null });
        }
      }

      openModal = () => this.setState({ modal: true });
    
      closeModal = () => this.setState({ modal: false });
    
      handleChange = event => {
        this.setState({ [event.target.name]: event.target.value });
      };

      handelKeyDown = event =>{
        if(event.keyCode === 13) {
          this.sendMessage();
        }

        const { message, typingRef, channel, user } = this.state
        if (message) {
          typingRef
          .child(channel.id)
          .child(user.uid)
          .set(user.displayName)
        } else {
          typingRef
          .child(channel.id)
          .child(user.uid)
          .remove()
        }
      }

      handleTogglePicker = () => {
        this.setState({ emojiPicker : !this.state.emojiPicker})
      }

      handleAddEmoji = emoji => {
          const oldMessage = this.state.message;
          const newMessage = this.colonToUnicode(`${oldMessage} ${emoji.colons} `);
          this.setState({ message: newMessage})
          // this.messageInputRef.focus()
      }
    
      colonToUnicode = message => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
          x = x.replace(/:/g, "");
          let emoji = emojiIndex.emojis[x];
          if (typeof emoji !== "undefined") {
            let unicode = emoji.native;
            if (typeof unicode !== "undefined") {
              return unicode;
            }
          }
          x = ":" + x + ":";
          return x;
        });
      };
      
      createMessage = (fileUrl = null) => {
        const message = {
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          user: {
            id: this.state.user.uid,
            name: this.state.user.displayName,
            avatar: this.state.user.photoURL
          }
        };
        if (fileUrl !== null) {
          message["image"] = fileUrl;
        } else {
          message["content"] = this.state.message;
        }
        return message;
      };
    
      sendMessage = () => {
        const { getMessagesRef } = this.props;
        const { message, channel, typingRef, user } = this.state;
    
        if (message) {
          this.setState({ loading: true });
          getMessagesRef()
            .child(channel.id)
            .push()
            .set(this.createMessage())
            .then(() => {
              this.setState({ loading: false, message: "", errors: [] });
              typingRef
                .child(channel.id)
                .child(user.uid)
                .remove()
            })
            .catch(err => {
              console.error(err);
              this.setState({
                loading: false,
                errors: this.state.errors.concat(err)
              });
            });
        } else {
          this.setState({
            errors: this.state.errors.concat({ message: "Add a message" })
          });
        }
      };

      getPath = () =>{
        if (this.props.isPrivateChannel) {
          return `chat/private/${this.state.channel.id}`
        }else{
          return 'chat/public'
        }
      }
    
      uploadFile = (file, metadata) => {
        const pathToUpload = this.state.channel.id;
        const ref = this.props.getMessagesRef();
        const filePath = `${this.getPath()}/${uuidv4()}.jpg`;
    
        this.setState(
          {
            uploadState: "uploading",
            uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
          },
          () => {
            this.state.uploadTask.on(
              "state_changed",
              snap => {
                const percentUploaded = Math.round(
                  (snap.bytesTransferred / snap.totalBytes) * 100
                );
                this.props.isProgressBarVisible(percentUploaded)
                this.setState({ percentUploaded });
              },
              err => {
                console.error(err);
                this.setState({
                  errors: this.state.errors.concat(err),
                  uploadState: "error",
                  uploadTask: null
                });
              },
              () => {
                this.state.uploadTask.snapshot.ref
                  .getDownloadURL()
                  .then(downloadUrl => {
                    this.sendFileMessage(downloadUrl, ref, pathToUpload);
                  })
                  .catch(err => {
                    console.error(err);
                    this.setState({
                      errors: this.state.errors.concat(err),
                      uploadState: "error",
                      uploadTask: null
                    });
                  });
              }
            );
          }
        );
      };
    
      sendFileMessage = (fileUrl, ref, pathToUpload) => {
        ref
          .child(pathToUpload)
          .push()
          .set(this.createMessage(fileUrl))
          .then(() => {
            this.setState({ uploadState: "done" });
          })
          .catch(err => {
            console.error(err);
            this.setState({
              errors: this.state.errors.concat(err)
            });
          });
      };
    
      render() {
        const { 
          errors, 
          message, 
          loading, 
          modal, 
          percentUploaded, 
          uploadState, 
          emojiPicker 
        } = this.state;
    
        return (
          <>{emojiPicker && (
            <Picker 
              onSelect={this.handleAddEmoji}
              style={{
                width: '50%',
                position: 'fixed',
                zIndex: 1,
                top: 0
              }}
              set='apple'
              className="emojipicker"
              title='Pick your emoji'
              emoji="point_up"
            />
          )}
          <Segment className="message__form">
            {uploadState === "uploading" ? (
              <ProgressBar 
                uploadState={uploadState}
                percentUploaded={percentUploaded}
            />
            ):
            (
              <>
                <Button
                    style={{width: '37px', height: '37px'}}
                    color="teal"
                    disabled={uploadState === 'uploading'}
                    onClick={this.openModal}
                    icon="cloud upload"
                  />
                <Input
                  fluid
                  name="message"
                  onChange={this.handleChange}
                  onFocus={() => this.setState({emojiPicker:false})}
                  onKeyDown={this.handelKeyDown}
                  ref={node => (this.messageInputRef = node)}
                  value={message}
                  style={{ marginBottom: "0.7em", width: '100%' }}
                  label={<Button 
                    style={{background: '#00B5AD'}}
                    icon={emojiPicker ? "close" : "add"}
                    onClick={this.handleTogglePicker}
                  />}
                  labelPosition="left"
                  className={
                    errors.some(error => error.message.includes("message"))
                      ? "error"
                      : ""
                  }
                  placeholder="Write your message"
                />
                  <Button
                    style={{width: '37px', height: '37px', background:'#EF233C', marginLeft: '0.5rem'}}
                    onClick={this.sendMessage}
                    disabled={loading}
                    color='grey'
                    icon="send"
                  />
                <FileModal
                    modal={modal}
                    closeModal={this.closeModal}
                    uploadFile={this.uploadFile}
                />
              </>
            )}
          </Segment>
          </>
        );
      }
    
}

export default MessagesForm;