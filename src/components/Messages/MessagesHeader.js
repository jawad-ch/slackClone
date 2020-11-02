import React, { Component } from 'react'
import { Segment, Header, Icon, Input } from 'semantic-ui-react';

class MessagesHeader extends Component {
    render() {

        const { 
            channelName, 
            numUniqueUsers, 
            handelSearchChange, 
            searchLoading, 
            isPrivateChannel,
            handelStar,
            isChannelStarred
        } = this.props;

        return (
            <Segment clearing className='messagesHeader'>
                <Header fluid='true' as='h2' floated='left' style={{marginBottom : 0}}>
                    <span>
                        {channelName}
                        {!isPrivateChannel && (
                            <Icon 
                                onClick={handelStar} 
                                name={isChannelStarred ? 'star' : 'star outline'}
                                color={isChannelStarred ? 'yellow' : 'black'}
                            />
                        )}
                    </span>
                    <Header.Subheader>
                    {numUniqueUsers}
                </Header.Subheader>
                </Header>
                {/* channel search input */}
                <Header floated='right'>
                    <Input 
                    loading={searchLoading}
                    onChange={handelSearchChange}
                    size='mini'
                    icon='search'
                    name="searchTerm"
                    placeholder='Search Messages' />
                </Header>
            </Segment>
        )
    }
}

export default  MessagesHeader;