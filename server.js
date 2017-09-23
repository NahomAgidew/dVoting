const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log('connecting to the blockchain...');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const deployedContractAddress = '0xaffbe1d0265dc09119ddb06e19eaa8a23f66db09';
const code = fs.readFileSync('./Voting.sol').toString();
const compiledCode = solc.compile(code);
const abi = JSON.parse(compiledCode.contracts[':Voting'].interface);
const votingContract = web3.eth.contract(abi);
const contractInstance = votingContract.at(deployedContractAddress);

console.log('connected to the blockchain.');

const candidates = {
    'John': 'candidate-1',
    'Nick': 'candidate-2',
    'Ana': 'candidate-3'
};

app.set('view engine', 'ejs');

function getVotes() {
    let candidateValues = Object.values(candidates);
    let candidateNames = Object.keys(candidates);

    let votes = {};
    for (let i = 0; i < candidateValues.length; i++) {
        votes[candidateValues[i]] = contractInstance.totalVotesFor.call(candidateNames[i]).toString();
    }

    return votes;
}

app.get('/', function(req, res) {

    res.render('index', {
        votes: getVotes()
    });
});

app.post('/vote', function(req, res, next) {
    let candidateToVoteFor = req.body['candidate'];
    if (Object.keys(candidates).indexOf(candidateToVoteFor) === -1) {
        res.render('index', {
            votes: getVotes(),
            message: "Error: Candidate doesn't exist."
        });
    } else {
        contractInstance.voteForCandidate(candidateToVoteFor, {from: web3.eth.accounts[0]});
        res.render('index', {
            votes: getVotes(),
            message: "Voted!"
        });
    }
});

app.listen(process.env.PORT || 3000, function() {
    console.log('server running on port 3000...');
});