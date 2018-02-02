import React from "react";
import PropTypes from "prop-types";

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
        return <li onClick={() => this.handleClick()}>
            {name}
            {domain ? " (@" + domain + ")" : " <unknown domain>"}
            {this.state.expanded && <SponsorDetails sponsor={sponsor} />}
        </li>;
    }
}

Sponsor.propTypes = {
    sponsor: PropTypes.object.isRequired
}

function SponsorDetails(props) {
    const {sponsor} = props;
    const {list, board, customData} = sponsor;
    let contact = null;
    if (customData) {
        contact = customData["Main contact (Email)"];
    }
    return (
        <div>
            <div>Board: {board}, List: {list}, Contact: {contact}</div>
            <div>{JSON.stringify(Object.keys(sponsor))}</div>
        </div>);
}


export default function Sponsors(props) {
    const {sponsors} = props;
    return <ul>{sponsors.map(sponsor => <Sponsor key={sponsor.id} sponsor={sponsor} />)}</ul>;
}

Sponsors.propTypes = {
    sponsors: PropTypes.arrayOf(Object).isRequired    
}
