import React, { Component } from 'react';
import recognizeMic from 'watson-speech/speech-to-text/recognize-microphone';

class SpeechToText extends Component {
  constructor() {
    super();
    this.state = {
      error: null,
    };
    this.listenMic = this.listenMic.bind(this);
  }
  listenMic() {
    fetch('http://localhost:3002/api/speech-to-text/token')
      .then(response => response.text()).then((token) => {
        const stream = recognizeMic({
          token,
          objectMode: true, // send objects instead of text
          extractResults: true, // convert {results: [{alternatives:[...]}], result_index: 0} to {alternatives: [...], index: 0}
          format: false, // optional - performs basic formatting on the results such as capitals an periods
        });
        stream.on('data', (data) => {
          this.setState({
            text: data.alternatives[0].transcript,
          });
        });
        stream.on('error', (err) => {
          throw new Error(err);
        });
        document.querySelector('#stop').onclick = stream.stop.bind(stream);
      }).catch((error) => {
        this.setState({ error });
      });
  }
  render() {
    return (
      <section className="hero is-light is-fullheight">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">
              Watson API
            </h1>
            <h2 className="subtitle">
              {this.state.text ? this.state.text : 'Say something!'}
            </h2>
            {this.state.error ? <div>Connection problem</div> : null}

            <button onClick={this.listenMic} className="button is-primary"><i className="fa fa-microphone" /></button>
          </div>
        </div>
      </section>);
  }
}
export default SpeechToText;
