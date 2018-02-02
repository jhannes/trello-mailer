
import React from "react";

export class Toggle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {expanded: props.default || false};
    }

    handleClick(e) {
        e.preventDefault();
        const {onClick} = this.props;
        onClick();
    }

    render() {
        const {children} = this.props;
        return <a href="#" onClick={e => this.handleClick(e)}>{children}</a>
    }

}