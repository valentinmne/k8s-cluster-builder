import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
        constructor(props) {
        super(props);
        this.state = {
        error: null,
        isLoaded: false,
        items: []
                    };
                  }
 componentDidMount() {
   fetch(`http://`process.env.api_ip`:7000/db`, {
      headers : {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*'
       }

    })

          .then(response => response.json())
          .then(data => console.log(data));
        }
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
            APICALLMADE
        </p>
      </div>
    );
  }
}

export default App;
