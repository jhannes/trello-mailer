import React from "react";
import PropTypes from "prop-types";

import firebase from "firebase";

import {Toggle, EditableText} from "./components.jsx";
import addrs from "email-addresses";

function Loader() {
    return <div>Loading...</div>;
}

class Sponsor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {expanded: false};
    }

    handleClick() {
        this.setState({expanded: !this.state.expanded});
    }

    handleContactChange(value) {
        const {sponsor} = this.props;
        firebase.database().ref(`sponsors/${sponsor.key}/customData`).update({"Main contact (Email)": value.contact});

        const domain = addrs.parseAddressList(value.contact)[0].domain;
        firebase.database().ref(`sponsors/${sponsor.key}`).update({"domain": domain});        
    }

    render() {
        const {sponsor} = this.props;
        const {name, customData, domain} = sponsor;
        let contact = null;
        if (customData) {
            contact = customData["Main contact (Email)"];
        }
        return <li>
            <Toggle onClick={() => this.handleClick()}>{name}</Toggle>
            <span> | </span>
            <strong>Contact:</strong> <EditableText propName="contact" value={contact || "<none>"} change={value => this.handleContactChange(value)} />
            <span> | </span>
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
        const {list, board, emails, id} = sponsor;
        const trelloLink = `https://trello.com/c/${id}`;
        return (
            <div>
                <div>Board: <a href={trelloLink} target="trello">{board}</a>, List: {list}</div>
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
        this.state = {};
    }

    componentWillMount() {
        const sponsorsRef = firebase.database().ref('sponsors');
        sponsorsRef.once('value', snapshot => {
            const items = snapshot.val();
            let sponsors = [];
            for (let item in items) {
                sponsors.push({ key: item, ...items[item] });
            }
            sponsors.sort((a, b) => a.name.localeCompare(b.name));
            this.setState({sponsors: sponsors});
        }, err => {
            console.error("firebase", err);
        });       
        sponsorsRef.on('child_changed', data => {
            const value = data.val();
            const {sponsors} = this.state;
            const sponsor = sponsors.findIndex(s => s.key == data.key);
            sponsors[sponsor] = { key: data.key, ...value };
            this.setState({sponsors: sponsors});
        }) 
    }

    render() {
        const {sponsors} = this.state;
        if (!sponsors) {
            return <Loader />;
        }
        return <ul>{sponsors.map(sponsor => <Sponsor key={sponsor.id} sponsor={sponsor} />)}</ul>;
    }
}
