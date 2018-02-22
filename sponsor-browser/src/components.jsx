
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

import {RIEInput} from "riek";

export class EditableText extends RIEInput {

}


export function Loading() {
    return <div>Loading...</div>;
}
