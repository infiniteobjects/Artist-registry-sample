import "./styles.css";
import $ from "jquery";
import Web3 from "web3";

const contractAddress = "0x4A0FAE65C2E9E70e8F73763834E6C95460eD67d6"; // Rinkeby
const abi =
  '[{"inputs":[{"internalType":"bool","name":"_accepted","type":"bool"}],"name":"signContract","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getSignedValue","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"hasSigned","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"getVersion","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function","constant":true}]';
let myAccount;
let instance;
let gasPrice;

$(() => {
  async function connectMetaMask() {
    if (window.ethereum) {
      try {
        await ethereum.enable();
        window.web3 = new Web3(ethereum);
        ethereum.on("chainChanged", (_chainId) => window.location.reload());
        getInfoFromContract();
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider);
      web3.eth.getAccounts().then((addr) => {
        getInfoFromContract();
      });
    }
    // Non-dapp browsers...
    else {
      alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  async function getInfoFromContract() {
    let accounts = await web3.eth.getAccounts();
    appendText(`Account: ${accounts[0]}`);

    gasPrice = await web3.eth.getGasPrice();
    appendText(`Gas Price: ${gasPrice}`);

    myAccount = accounts[0];
    $("#myAddress").html(`My Wallet Addr: ${myAccount}`);
    appendText(`My Wallet Addr: ${myAccount}`);

    web3.eth.defaultAccount = myAccount;

    let balance = await web3.eth.getBalance(myAccount);
    appendText(`balance: ${balance}`);

    instance = new web3.eth.Contract(JSON.parse(abi), contractAddress, {
      from: myAccount
    });

    let ver = await instance.methods.getVersion().call();
    appendText(`Contract Version: ${ver}`);

    let hasSigned = await instance.methods.hasSigned(myAccount).call();
    appendText(`has Signed: ${hasSigned}`);

    let data = await instance.methods.getSignedValue(myAccount).call();
    appendText(
      `Choise of the account is: <span style='color:red'> ${
        data ? "Yes" : "No"
      } </span>`
    );

    if (data) {
      $("#answerYes").click();
    } else {
      $("#answerNo").click();
    }

    $("#sign-ui").show();
  }

  async function signContract() {
    if (instance) {
      let answer =
        $("input[name=answer]:checked").attr("id") === "answerYes"
          ? true
          : false;

      $("#sign-button").prop("disabled", true);
      $("#sign-button").html("Signing...");

      await instance.methods.signContract(answer).send({
        from: myAccount,
        gas: 0,
        gasPrice: web3.utils.toWei(web3.utils.fromWei(gasPrice, "ether"))
      });

      $("#status").html("");
      $("#sign-button").prop("disabled", false);
      $("#sign-button").html("Sign");
      getInfoFromContract();
    }
  }

  function appendText(txt) {
    $("#status").append(`<p>${txt}</p>`);
  }

  $("#connect-button").on("click", (e) => {
    connectMetaMask();
  });
  $("#sign-button").on("click", (e) => {
    signContract();
  });
});

document.getElementById("app").innerHTML = `
<h1>Artist Registry</h1>
<button id='connect-button'>Connect Meta Mask</button>
*choose network "Rinkeby"

<div id='status'></div>

<div id='sign-ui' style='display:none'>

<hr>
  <p>
  Opt-in UI
    <div class="form-check">
      <input class="form-check-input" type="radio" name="answer" id="answerYes">
      <label class="form-check-label" for="flexRadioDefault1">
        Yes
      </label>
    </div>
    <div class="form-check">
      <input class="form-check-input" type="radio" name="answer" id="answerNo" checked>
      <label class="form-check-label" for="flexRadioDefault2">
        No
      </label>
    </div>
  </p>

  <p>
    <button id='sign-button' class='btn btn-dark'> Sign </button>
  </p>
</div>
`;
