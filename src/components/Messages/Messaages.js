import React, { Component, Fragment } from 'react'
import { Segment, Comment } from 'semantic-ui-react';
import MessagesHeader from './MessagesHeader';
import MessagesForm from './MessagesForm';
import { DB } from '../../firebase'
import Message from './Message';
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions';
import Typing from './Typing';
import Skeleton from './Skeleton';

class Messages extends Component {

    state = {
        privateChannel:this.props.isPrivateChannel,
        privateMessagesRef: DB.ref('privateMessages'),
        messagesRef : DB.ref('messages'),
        usersRef : DB.ref('users'),
        channel: this.props.currentChannel,
        isChannelStarred: false,
        user: this.props.currentUser,
        messages: [],
        messagesLoading: true,
        numUniqueUsers: '',
        searchTerm : '',
        searchLoading : false,
        searchResult: [],
        progressBar: false,
        typingRef: DB.ref('typing'),
        connectedRef: DB.ref('.info/connected'),
        typingUsers: [],
        listeners: []
    }

    componentDidMount (){
        const { channel,  user, listeners} = this.state
        if (channel && user) {
            this.removeLiseners(listeners);
            this.addListeners(channel.id);
            this.addUserStarsListeners(channel.id, user.uid);
        }
    }

    componentDidUpdate ( prevProps, prevState ) {
        if (this.messagesEnd) {
            this.scrollToBottom();
        }
    }

    componentWillUnmount () {
        this.removeLiseners(this.state.listeners);
        this.state.connectedRef.off();
    }

    removeLiseners = listeners => {
        listeners.forEach(listener => {
            listener.ref.child(listener.id).off(listener.event)
        });
    }

    addToListeners = (id, ref, event) =>{
        const index = this.state.listeners.findIndex(listener => {
            return listener.id === id 
                && listener.ref === ref 
                && listener.event === event;
        })
        if (index === -1) {
            const newListener = {id, ref, event}
            this.setState({ listeners: this.state.listeners.concat(newListener) });
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({
            behavior: 'smooth',
        })
    }

    addListeners = channelId =>{
        this.addMessageListener(channelId);
        this.addTypingListener(channelId);
    }

    addTypingListener = channelId =>{
        let typingUsers = [];

        this.state.typingRef
        .child(channelId)
        .on('child_added', snap =>{
            if (snap.key !== this.state.user.uid) {
                typingUsers = typingUsers.concat({
                    id:snap.key,
                    name: snap.val()
                })
                this.setState({ typingUsers })
            }
        });

        this.addToListeners(channelId, this.state.typingRef, 'child_added')

        this.state.typingRef
        .child(channelId)
        .on('child_removed', snap =>{
            const index = typingUsers.findIndex(user => user.id === snap.key);
            if (index !== -1) {
                typingUsers = typingUsers.filter(user => user.id !== snap.key);
                this.setState({ typingUsers});
            }
        });

        this.addToListeners(channelId, this.state.typingRef, 'child_removed')

        this.state.connectedRef.on('value', snap =>{
            if (snap.val() === true) {
                this.state.typingRef
                    .child(channelId)
                    .child(this.state.user.uid)
                    .onDisconnect()
                    .remove(err => {
                        if (err !== null) {
                            console.error(err)
                        }
                    })
            }
        })
    }
    addMessageListener = channelId =>{
        let loadedMessages = [];
        const ref = this.getMessagesRef();
        ref.child(channelId)
        .on('child_added', snap =>{
            loadedMessages.push(snap.val())
            this.setState({
                messages: loadedMessages,
                messagesLoading: false
            });
            this.countUniqueUsers(loadedMessages);
            this.countUserPosts(loadedMessages);
        });
        this.addToListeners(channelId, ref, 'child_added')
    };


    addUserStarsListeners = (channelId, userId) =>{
        this.state.usersRef
        .child(userId)
        .child('starred')
        .once('value')
        .then(data=> {
            if(data.val() !== null){
                const channelIds = Object.keys(data.val());
                const prevStarred = channelIds.includes(channelId);
                this.setState({ isChannelStarred: prevStarred })
            }
        })
    };

    getMessagesRef = () =>{
        const { messagesRef, privateChannel, privateMessagesRef } = this.state;
        return privateChannel ? privateMessagesRef : messagesRef;
    }


    handelStar = () =>{
        this.setState(prevState =>({
            isChannelStarred : !prevState.isChannelStarred
        }), () =>this.starChannel())
    }

    starChannel = () => {
        if (this.state.isChannelStarred) {
             this.state.usersRef
             .child(`${this.state.user.uid}/starred`)
             .update({
                 [this.state.channel.id]: {
                     name: this.state.channel.name,
                     details: this.state.channel.details,
                     createdBy: {
                         name: this.state.channel.createdBy.name,
                         avatar: this.state.channel.createdBy.avatar
                     }
                 }
             })
        }else{
            this.state.usersRef
            .child(`${this.state.user.uid}/starred`)
            .child(this.state.channel.id)
            .remove(err =>{
                if (err !== null) {
                    console.log(err)
                }
            });
        }
    }
        handelSearchChange = e =>{
        this.setState({
            searchTerm : e.target.value,
            searchLoading : true
        },
        () =>this.handelSearchMessages())
    }

    handelSearchMessages = () =>{
        const channelMessages = [...this.state.messages]
        const regex = new RegExp(this.state.searchTerm, 'gi')
        const searchResult = channelMessages.reduce((acc, message) =>{
            if (message.content && 
                message.content.match(regex) ||
                message.user.name.match(regex)) {
                acc.push(message)
            }
            return acc;
        }, [])
        this.setState({ searchResult })

        setTimeout(() => {
        this.setState({ searchLoading: false })            
        }, 1000);
    }

    countUniqueUsers = messages =>{
        const uniqueUsers = messages.reduce((acc, message) =>{
            if (!acc.includes(message.user.name)) {
                acc.push(message.user.name)
            }
            return acc;
        }, [])

        const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;

        const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`
        this.setState({numUniqueUsers})
    }

    countUserPosts = messages =>{
        let userPosts = messages.reduce((acc, message) =>{
            if (message.user.name in acc) {
                acc[message.user.name].count += 1
            }else{
                acc[message.user.name] ={
                    avatar: message.user.avatar,
                    count : 1,
                }
            }
            return acc;
        }, {});
        this.props.setUserPosts(userPosts)
    }

    displayMessages = messages =>{
        return messages.length > 0 && messages.map(message =>(
            <Message
            key={message.timestamp}
            message={message}
            user={this.state.user}
            />
        ))
    }

    displayChannelName = channel => {
        return channel ? `${this.state.privateChannel ? '@' : '#'}${channel.name}` : ''; 
    }
    // channel ? `#${channel.name}`: ''; 

    isProgressBarVisible = percent => {
        if (percent > 0) {
            this.setState({progressBar : true})
        }else if(percent === 100){
            this.setState({progressBar : false})
        }
    }

    displayTypingUsers = users => (
        users.length > 0 && users.map(user => (
            <div key={user.id} style={{display: 'flex', alignItems:'center', marginBottom: '0.2em'}}>
                <span className='user__typing'>{user.name} is typing</span><Typing/>
            </div>
        ))
    )

    displayMessagesSkeleton = loading =>
        loading ? (
            <Fragment>
                {[...Array(8)].map((_, i) =>(
                    <Skeleton key={i}/>
                ))}
            </Fragment>
        ) : null ;

    render() {

        const { 
            messagesRef, 
            channel, 
            user, 
            messages, 
            numUniqueUsers, 
            searchTerm, 
            searchResult, 
            searchLoading, 
            progressBar, 
            privateChannel,
            isChannelStarred,
            typingUsers,
            messagesLoading
        } = this.state

        return (
            <Fragment>
                <MessagesHeader 
                channelName={this.displayChannelName(channel)}
                numUniqueUsers={numUniqueUsers}
                handelSearchChange={this.handelSearchChange}
                searchLoading={searchLoading}
                isPrivateChannel={privateChannel}
                isChannelStarred={isChannelStarred}
                handelStar={this.handelStar}
                />

                <Segment className="messagesBox">
                    <Comment.Group className='messages'>
                        {this.displayMessagesSkeleton(messagesLoading)}
                        {
                        searchTerm ? 
                            this.displayMessages(searchResult) 
                            :
                            this.displayMessages(messages)
                        }
                        {this.displayTypingUsers(typingUsers)}
                        <div ref={node => (this.messagesEnd = node)}></div>
                    </Comment.Group>
                </Segment>

                <MessagesForm
                    messagesRef={messagesRef}
                    currentChannel={channel}
                    currentUser={user}
                    isProgressBarVisible={this.isProgressBarVisible}
                    isPrivateChannel={privateChannel}
                    getMessagesRef={this.getMessagesRef}
                />
                
            </Fragment>
        )
    }
}

export default connect(null, { setUserPosts })(Messages);