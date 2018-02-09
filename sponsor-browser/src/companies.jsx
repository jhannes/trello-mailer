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
        this.state = {expanded: true};
    }

    handleClick() {
        this.setState({expanded: !this.state.expanded});
    }

    handleContactChange(value) {
        const mainContact = value.contact;
        const {sponsor} = this.props;
        const {key} = sponsor;
        firebase.database().ref(`companies/${key}`).update({mainContact});

        const domain = addrs.parseAddressList(mainContact)[0].domain;
        let domains = sponsor.domains || [];
        if (domains.indexOf(domain) != null) {
            domains = domains.concat([domain]);
            firebase.database().ref(`companies/${key}`).update({domains});
        }
    }

    render() {
        const {sponsor} = this.props;
        const {name, mainContact, domains} = sponsor;
        return <li>
            <Toggle onClick={() => this.handleClick()}>{name}</Toggle>
            <span> | </span>
            <strong>Contact:</strong> <EditableText propName="contact" value={mainContact || "<none>"} change={value => this.handleContactChange(value)} />
            <span> | </span>
            {domains ? domains.map(d => <span key={d}>@{d} </span>) : " <unknown domain>"}
            {this.state.expanded && <SponsorDetails sponsor={sponsor} />}
        </li>;
    }
}

Sponsor.propTypes = {
    sponsor: PropTypes.object.isRequired
}

class Sponsorship extends React.Component {
    render() {
        const {sponsorship} = this.props;
        const {board, id, list} = sponsorship;
        const trelloLink = `https://trello.com/c/${id}`;
        return <div>{board} <a href={trelloLink} target="trello">{list}</a></div>;
    }
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
        const emails = Object.values(sponsor.emails || {});
        return (
            <div>
                { Object.values(sponsor.sponsorships).map(sponsorship => <Sponsorship key={sponsorship.board} sponsorship={sponsorship} />) }
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

export default class SponsorCompanies extends React.Component {
    constructor(props) {
        super(props);
        this.state = {companies: null};
    }

    componentWillMount() {
        const companiesRef = firebase.database().ref('companies');
        companiesRef.once('value', snapshot => {
            const items = snapshot.val();
            let companies = [];
            for (let item in items) {
                companies.push({ key: item, ...items[item] });
            }
            companies.sort((a, b) => a.name.localeCompare(b.name));
            this.setState({companies});
        }, err => {
            console.error("firebase", err);
        });       

        companiesRef.on('child_changed', data => {
            const value = data.val();
            const {companies} = this.state;
            const sponsor = companies.findIndex(s => s.key == data.key);
            companies[sponsor] = { key: data.key, ...value };
            this.setState({companies});
        }) 
    }

    render() {
        const {companies} = this.state;
        if (!companies) {
            return <Loader />;
        }
        return <div>
            <h2>Companies</h2>
            <ul>
                {companies.map((c, key) => <Sponsor key={key} sponsor={c} />)}
            </ul>
        </div>;
    }
}


