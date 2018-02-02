import React from "react";
import PropTypes from "prop-types";

import Sponsors from "./sponsors.jsx";

function Loader() {
    return <div>Loading...</div>;
}


class Application extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentWillMount() {
        fetch("./sponsors.json")
            .then(response => response.json())
            .then(json => {
                json.sort((a,b) => a.name.localeCompare(b.name));
                this.setState({sponsors: json});
            });
    }

    render() {
        const {sponsors} = this.state;
        if (sponsors) {
            return <Sponsors sponsors={sponsors} />;
        }
        return <Loader />;
    }

}


import ReactDOM from "react-dom";

ReactDOM.render(<Application />, document.getElementById('app'));
