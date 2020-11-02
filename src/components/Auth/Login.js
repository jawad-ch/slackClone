import React, { Component } from 'react'
import { Grid, Form, Segment, Button, Header, Message, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { Auth } from '../../firebase';


class Login extends Component {

    state = {
        email:'',
        password:'',
        errors : [],
        loading:false,

    }

    displayErrors = (errors, index) => errors.map((error) => (
        <p key={index} >{error.message}</p>
    ))

    handleChange = (e) => {
        this.setState({[e.target.name] : e.target.value})
    }
    handelSubmit = (e) => {
        e.preventDefault();
        if(this.isFormValid(this.state)) {
            this.setState({errors : [], loading:true});
            Auth.signInWithEmailAndPassword(this.state.email, this.state.password)
            .then(signedInUser =>{
                console.log(signedInUser)
                this.setState({
                    loading:false
                })
            }).catch(err =>{
                console.log(err)
                this.setState({
                    errors: this.state.errors.concat(err),
                    loading:false
                })
            })
        }
    }

    isFormValid = ({email, password}) => email && password;

    handleInputError = (errors, inputName) =>{
        return errors.some(error => error.message.toLowerCase().includes(inputName)) ? 
        "error"
        :
        ""
    }

    render() {

        const {email, password, errors, loading} = this.state

        return (
            <Grid textAlign='center' verticalAlign='middle' className='app'>
                <Grid.Column style={{maxWidth: 450}}>
                    <Header as='h1' icon color='violet' textAlign='center'>
                        <Icon name="code branch" color='violet' />
                        Login to JaChat
                    </Header>
                    <Form onSubmit={this.handelSubmit} size='large'>
                        <Segment stacked>
                            <Form.Input fluid name="email" icon='mail' 
                            iconPosition='left' placeholder='Email Address' 
                            onChange={this.handleChange} type='email' 
                            value={email}
                            className={this.handleInputError(errors, 'email')}/>

                            <Form.Input fluid name="password" icon='lock' 
                            iconPosition='left' placeholder='Password' 
                            onChange={this.handleChange} type='password' 
                            value={password}
                            className={this.handleInputError(errors, 'password')}/>

                            <Button disabled={loading} className={loading ? 'loading' : ''} color='violet' fluid size='large' >Submit</Button>
                        </Segment>
                    </Form>
                    {errors.length > 0 && (
                        <Message error>
                            <h3>Error</h3>
                            {this.displayErrors(errors)}
                        </Message>
                    )}
                    <Message>Don't have an account ? <Link to='/register'>Register</Link></Message>
                </Grid.Column>
            </Grid>
        )
    }
}

export default Login;