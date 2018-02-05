import React from "react";
import PropTypes from "prop-types";

import SponsorCompanies from "./companies.jsx";

function Loader() {
    return <div>Loading...</div>;
}


import firebase from "firebase";

// Initialize Firebase
var config = {
    apiKey: "AIzaSyD4UuyrH-h1TYmO03-2UJy5R3cjpZxMjsA",
    authDomain: "mobileera-crm.firebaseapp.com",
    databaseURL: "https://mobileera-crm.firebaseio.com",
    projectId: "mobileera-crm",
    storageBucket: "mobileera-crm.appspot.com",
    messagingSenderId: "998796256462"
};
firebase.initializeApp(config);


const firebaseAuthProvider = new firebase.auth.GoogleAuthProvider();
const firebaseAuth = firebase.auth();

class Login extends React.Component {
    login() {
        firebaseAuth.signInWithPopup(firebaseAuthProvider)
            .then(result => {
                this.props.onLogin(result.user);
            });
    }

    render() {
        return <button onClick={() => this.login()}>Please log in</button>;
    }
}

Login.propTypes = {
    onLogin: PropTypes.func.isRequired
}


class Application extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            awaitingLogin: true,
            user: null,
            route: window.location.hash
        };
    }

    componentWillMount() {
        firebaseAuth.onAuthStateChanged(user => {
            if (user) {
                this.setState({user, awaitingLogin: false});
            } else {
                this.setState({user, awaitingLogin: false});
            }
        });
        window.addEventListener("hashchange", () => {
            this.setState({route: window.location.hash});
        });
    }

    handleLogin(user) {
        this.setState({user});
    }

    render() {
        const {user, awaitingLogin} = this.state;
        if (awaitingLogin) {
            return <Loader />;
        }
        if (!user) {
            return <Login onLogin={user => this.handleLogin(user)} />;
        }
        return <SponsorCompanies />;
    }

}


import ReactDOM from "react-dom";

ReactDOM.render(<Application />, document.getElementById('app'));
