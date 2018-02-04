import React from "react";
import PropTypes from "prop-types";

import firebase from "firebase";

import {Toggle} from "./components.jsx"

class Sponsor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {expanded: false};
    }

    handleClick() {
        this.setState({expanded: !this.state.expanded});
    }

    render() {
        const {sponsor} = this.props;
        const {name, domain} = sponsor;
        return <li>
            <Toggle onClick={() => this.handleClick()}>{name}</Toggle>
            {domain ? " (@" + domain + ")" : " <unknown domain>"}
            {this.state.expanded && <SponsorDetails sponsor={sponsor} />}
        </li>;
    }
}

Sponsor.propTypes = {
    sponsor: PropTypes.object.isRequired
}

class SponsorDetails extends React.Component {
    constructor(props) {
        super(props);
        this.state = {expandedEmails: false}
    }

    handleClickEmails() {
        this.setState({expandedEmails: !this.state.expandedEmails});
    }

    render() {
        const {sponsor} = this.props;
        const {expandedEmails} = this.state;
        const {list, board, customData, emails} = sponsor;
        let contact = null;
        if (customData) {
            contact = customData["Main contact (Email)"];
        }
        return (
            <div>
                <div>Board: {board}, List: {list}, Contact: {contact}</div>
                <div>{JSON.stringify(Object.keys(sponsor))}</div>
                { emails && <div><Toggle onClick={() => this.handleClickEmails()}>{emails.length} emails</Toggle></div> }        
                {expandedEmails && emails && <SponsorEmails emails={emails} />}
            </div>);
    }
}

class SponsorEmails extends React.Component {
    render() {
        const {emails} = this.props;
        return <ul>{emails.map(email => <li key={email.messageId}>{email.date}: {email.from} -> {email.to}: {email.subject}</li>)}</ul>;
    }
}


export default class Sponsors extends React.Component {
    constructor(props) {
        super(props);
        this.state = {sponsors: []};
    }

    componentWillMount() {
        const sponsorsRef = firebase.database().ref('sponsors');
        sponsorsRef.on('value', snapshot => {
            let sponsors = snapshot.val();
            sponsors.sort((a, b) => a.name.localeCompare(b.name));
            this.setState({sponsors: sponsors});
        }, err => {
            console.error("firebase", err);
        });        
    }

    render() {
        const {sponsors} = this.state;
        return <ul>{sponsors.map(sponsor => <Sponsor key={sponsor.id} sponsor={sponsor} />)}</ul>;
    }
}
