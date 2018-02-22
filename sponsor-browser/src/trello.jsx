import React from "react";

import firebase from "firebase";

import qs from "qs";
import axios from "axios";

import {Loading} from "./components.jsx";

export class Trello extends React.Component {
    constructor(props) {
        super(props);

        const queryPos = location.href.indexOf("?");
        if (queryPos > 0) {
            const query = qs.parse(location.href.substr(queryPos + 1));
            this.state = {
                token: query.token
            }
        } else {
            this.state = {};
        }
    }

    handleClick() {
        const {accessKey} = this.props;
        const params = {
            "response_type": "token",
            "callback_method": "fragment",
            name: "Mobile Era CRM",
            key: accessKey,
            "return_url": window.location.href.split("#")[0] + "#/trello?login=true",
            scope: "read,write"
        }
        window.location = "https://trello.com/1/authorize?" + qs.stringify(params);
    }

    render() {
        const {accessKey} = this.props;
        const {token} = this.state;
        if (token) {
            return <TrelloBoards accessKey={accessKey} token={token} />;
        }

        return <div>
            Hello Trello
            <button onClick={() => this.handleClick()}>Log into Trello</button>
        </div>;
    }

}


class TrelloBoards extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentWillMount() {
        const {accessKey, token} = this.props;

        axios.get("https://api.trello.com/1/organizations/mobileera2018/boards/?" + qs.stringify({key: accessKey, token})).then(response => {
            this.setState({boards: response.data});
        });
    }

    selectBoard(board) {
        this.setState({board});
    }

    render() {
        const {accessKey, token} = this.props;
        const {boards, board} = this.state;
        if (board) {
            return <SponsorImport accessKey={accessKey} token={token} board={board} />
        }
        if (boards) {
            return boards.map(board => <div><button key={board.id} onClick={() => this.selectBoard(board)}>{board.name}</button></div>);
        }
        return <div>Loading...</div>;
    }
}

import {Sponsor, SponsorCompanies} from "./companies.jsx";

class ActiveSponsorImport extends React.Component {
    constructor(props) {
        super(props);
        this.state = {completed: []};
    }

    notImported(company) {
        const {board} = this.props;
        return !company.sponsorships[board.name] || !company.sponsorships[board.name].board
    }

    componentWillMount() {
        const {companies, importing, onComplete} = this.props;
        Promise.all(companies.filter(c => this.notImported(c)).map(c => this.companyImporter(c, importing)))
            .then(onComplete);
    }

    desc(company) {
        let desc = "";
        if (company.mainContact) {
            desc += "**mainContact**: " + company.mainContact + "\n\n";
        }
        if (company.sponsorships["Sponsors 2016"]) {
            const sponsorship = company.sponsorships["Sponsors 2016"];
            desc += "**Mobile Era 2016**: " + sponsorship.list + " https://trello.com/c/" + sponsorship.id + "\n\n";            
        }
        if (company.sponsorships["Sponsors 2017"]) {
            const sponsorship = company.sponsorships["Sponsors 2017"];
            desc += "**Mobile Era 2017**: " + sponsorship.list + " https://trello.com/c/" + sponsorship.id + "\n\n";            
        }
        return desc;        
    }

    companyImporter(company, importing) {
        const {accessKey, token, board} = this.props;

        const card = {
            name: company.name,
            desc: this.desc(company)
        };
        const list = company.mainContact ? importing.withContact : importing.noContact;
        const url = `https://api.trello.com/1/lists/${list.id}/cards?` + qs.stringify({key: accessKey, token});
        return axios.post(url, card).then(resp => {
            const cardId = resp.data.id;
            firebase.database().ref('companies/' + company.key + '/sponsorships/' + board.name).set({
                id: cardId, board: board.name, list: list.name
            });
            return null;
        }).then(() => {
            const {completed} = this.state;
            completed.push(company);
            this.setState({completed});
        });
    }

    render() {
        const {companies} = this.props;
        const {completed} = this.state;
        return <div>Import in progress ({completed.length} of {companies.length})</div>;
    }
}


class SponsorImport extends SponsorCompanies {

    componentWillMount() {
        super.componentWillMount()

        const {accessKey, token, board} = this.props;
        axios.get(`https://api.trello.com/1/boards/${board.id}/lists?` + qs.stringify({key: accessKey, token})).then(response => {
            this.setState({lists: response.data});
        });
    }

    handleImport(noContact, withContact) {
        this.setState({importing: {withContact, noContact}});
    }

    handleCompleteImport() {
        this.setState({importing: null});
    }

    render() {
        const {companies, lists, importing} = this.state;
        if (!companies || !lists) {
            return <Loading />;
        }
        if (importing) {
            const {accessKey, token, board} = this.props;
            return <ActiveSponsorImport accessKey={accessKey} token={token} companies={companies} importing={importing}
                board={board}
                onComplete={() => this.handleCompleteImport()} />;
        }
        return <div>
            <SelectTrelloImportList lists={lists}
                onSubmit={(noContact, withContact) => this.handleImport(noContact, withContact)} />
            <h2>Companies</h2>
            <ul>
                {companies.map((c, key) => <Sponsor key={key} sponsor={c} />)}
            </ul>
        </div>;
    }
}

class SelectTrelloImportList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    handleChangeNoContact(e) {
        this.setState({listForNoContact: e.target.value});
    }

    handleChangeWithContact(e) {
        this.setState({listForWithContact: e.target.value});
    }

    handleClick() {
        const {listForNoContact, listForWithContact} = this.state;
        const {onSubmit, lists} = this.props;
        onSubmit(lists.find(list => list.id === listForNoContact), lists.find(list => list.id === listForWithContact));       
    }

    render() {
        const {lists} = this.props;

        return (
            <div>
                <label>
                    List for sponsors without contact:
                    <select onChange={e => this.handleChangeNoContact(e)}>
                        <option></option>
                        {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                    </select>
                </label>
                <label>
                    List for sponsors with contact:
                    <select onChange={e => this.handleChangeWithContact(e)}>
                        <option></option>
                        {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                    </select>
                </label>
                <button onClick={() => this.handleClick()}>Import</button>
            </div>
        );
    }

}
