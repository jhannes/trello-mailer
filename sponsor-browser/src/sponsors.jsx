import React from "react";
import PropTypes from "prop-types";

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
                <div><Toggle onClick={() => this.handleClickEmails()}>{emails.length} emails</Toggle></div>
                {expandedEmails && <SponsorEmails emails={emails} />}
            </div>);
    }
}

class SponsorEmails extends React.Component {
    render() {
        const {emails} = this.props;
        return <ul>{emails.map(email => <li key={email.messageId}>{email.date}: {email.from} -> {email.to}: {email.subject}</li>)}</ul>;
    }
}


export default function Sponsors(props) {
    const {sponsors} = props;
    return <ul>{sponsors.map(sponsor => <Sponsor key={sponsor.id} sponsor={sponsor} />)}</ul>;
}

Sponsors.propTypes = {
    sponsors: PropTypes.arrayOf(Object).isRequired    
}
