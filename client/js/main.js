const React = window.React;
const ReactDOM = window.ReactDOM;
const io = window.io;
const EventEmitter = window.EventEmitter3;

const {
    Grid,
    Col,
    Panel,
    Form,
    FormGroup,
    ControlLabel,
    FormControl,
    ButtonToolbar,
    Button,
    Alert,
    ListGroup,
    ListGroupItem
} = window.ReactBootstrap;

const defaultJaql = {};

const outputChannels = {
    POST_REQUEST: 'demo/POST_REQUEST',
    REJECT_REQUEST: 'demo/REJECT_REQUEST'
};

const inputChannels = {
    POST_REQUEST_RESPONSE: 'demo/POST_REQUEST_RESPONSE',
    REJECT_REQUEST_RESPONSE: 'demo/REJECT_REQUEST_RESPONSE'
};

class Client extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.initChannels();
        console.log('Socket client successfully initialized.')
    }

    initChannels() {
        // proxy all received messages to listeners
        Object.values(inputChannels).forEach((channel) => {
            this.socket.on(channel, this.emit.bind(this, channel))
        });
    }

    sendPostRequest(payload) {
        this.socket.emit(outputChannels.POST_REQUEST, payload);
    }

    sendRejectRequest(payload) {
        this.socket.emit(outputChannels.REJECT_REQUEST, payload);
    }
}

function initConnection() {
    return new Promise(resolve => {
        const socket = io('/jaqlcsveditor', { path: '/gateway' });
        socket.on('connect', () => resolve(new Client(socket)));
    });
}

function sendPostRequest(url, data) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

class App extends React.Component {
    constructor() {
        super();
        this.state = {
            // data fields
            postEndpoint: '',
            rejectEndpoint: '/api/{server}/{title}/cancel_queries',
            postPayload: JSON.stringify(defaultJaql, null, 4),
            rejectPayload: null,
            errorMessage: null,
            receivedChunks: [],

            // flags fields
            isRequesting: false,
            isSocketInitialized: false
        };
    }

    componentDidMount() {
        this.initClient();
    }

    async initClient() {
        try {
            this.client = await initConnection();
            this.client.on(inputChannels.POST_REQUEST_RESPONSE, this.handlePostRequestResponse.bind(this));
            this.client.on(inputChannels.REJECT_REQUEST_RESPONSE, this.handleRejectRequestResponse.bind(this));
            this.setState({ isSocketInitialized: true });
        } catch (e) {
            console.error('Occurs an error during socket client connection.');
        }
    }

    validatePayload() {
        // validate JSON
        let payload;
        try {
            payload = JSON.parse(this.state.postPayload);
        } catch (e) {
            this.setState({ errorMessage: 'Request payload should be valid JSON.' });
            throw e;
        }

        // validate required fields
        // if (!payload.queryGuid) {
        //     throw new Error('Required field is absent: [queryGuid].');
        // }
        this.setState({ errorMessage: null });
        return payload;
    }

    async sendPostRequest() {
        // validate request payload
        const parsedPostPayload = this.validatePayload();

        // set component state
        this.setState({
            isRequesting: true,
            receivedChunks: [],
            rejectPayload: { queries: parsedPostPayload.queryGuid }
        });

        // send post request
        const { postEndpoint, postPayload } = this.state;
        this.client.sendPostRequest({
            url: postEndpoint,
            payload: encodeURIComponent(postPayload)
        });
    }

    handlePostRequestResponse({ error, chunk, isDone }) {
        // handle error
        if (error) {
            this.setState({ errorMessage: error });
        }

        // handle last chunk
        const { receivedChunks } = this.state;
        if (isDone) {
            return this.setState({
                isRequesting: false,
                receivedChunks: [...receivedChunks, { chunk: 'Request is finished.', timestamp: Date.now(), isDone }]
            });
        }

        // handle sequent chunk
        return this.setState(state => ({
            receivedChunks: [...state.receivedChunks, { chunk, timestamp: Date.now(), isDone }]
        }));
    }

    handleRejectRequestResponse({ error, response }) {
        console.log('Reject request response was received:');
        console.log({ error, response });
        if (error) {
            return this.setState({ errorMessage: error });
        }
    }

    handleInputChange(field, event) {
        this.setState({ [field]: event.target.value });
    }

    renderReceivedChunks() {
        const { receivedChunks } = this.state;
        return React.createElement(
            ListGroup,
            { className: 'response' },
            receivedChunks.map(({ chunk, timestamp, isDone }, index) => React.createElement(
                ListGroupItem,
                { key: `${timestamp}-${index}` },
                chunk
            )),
            React.createElement('div', { ref: element => {
                    this.receivedChunksBottom = element;
                } })
        );
    }

    renderForm() {
        const {
            postEndpoint,
            rejectEndpoint,
            postPayload,
            receivedChunks,
            errorMessage,
            isSocketInitialized,
            isRequesting
        } = this.state;
        return React.createElement(
            Form,
            null,
            React.createElement(
                FormGroup,
                null,
                React.createElement(
                    ControlLabel,
                    null,
                    'Endpoint'
                ),
                React.createElement(FormControl, {
                    type: 'text',
                    value: postEndpoint,
                    onChange: e => this.handleInputChange('postEndpoint', e)
                })
            ),
            React.createElement(
                Col,
                { xs: 12, md: 6, lg: 6, className: 'form-column' },
                React.createElement(
                    FormGroup,
                    null,
                    React.createElement(
                        ControlLabel,
                        null,
                        'Request body'
                    ),
                    React.createElement(FormControl, {
                        componentClass: 'textarea',
                        rows: 15,
                        value: postPayload,
                        disabled: isRequesting,
                        onChange: e => this.handleInputChange('postPayload', e)
                    })
                )
            ),
            React.createElement(
                Col,
                { xs: 12, md: 6, lg: 6, className: 'form-column' },
                React.createElement(
                    FormGroup,
                    null,
                    React.createElement(
                        ControlLabel,
                        null,
                        'Response | Received chunks: ',
                        receivedChunks.length
                    ),
                    this.renderReceivedChunks()
                )
            ),
            errorMessage && React.createElement(
            Alert,
            { bsStyle: 'danger' },
            errorMessage
            ),
            React.createElement(
                ButtonToolbar,
                { className: 'form-buttons' },
                React.createElement(
                    Button,
                    {
                        bsStyle: 'primary',
                        disabled: !isSocketInitialized || isRequesting,
                        onClick: () => this.sendPostRequest()
                    },
                    'Make request'
                )
            )
        );
    }

    render() {
        return React.createElement(
            Grid,
            null,
            React.createElement(
                Panel,
                null,
                React.createElement(
                    Panel.Heading,
                    null,
                    React.createElement(
                        'h2',
                        null,
                        'Test'
                    )
                ),
                React.createElement(
                    Panel.Body,
                    null,
                    this.renderForm()
                )
            )
        );
    }
}

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
