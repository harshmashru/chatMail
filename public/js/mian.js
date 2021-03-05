const numberInput = document.getElementById("number"),
  button = document.getElementById("button"),
  response = document.querySelector(".response");

button.addEventListener("click", send, false);

const socket = io();
socket.on("smsStatus", function() {
  response.innerHTML = "<h5>Text message sent to " + data.number + "</h5>";
});

function send() {
  const number = numberInput.value.replace(/\D/g, "");

  fetch("/", {
    method: "post",
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify({ number: number })
  })
    .then(function() {
      console.log(res);
    })
    .catch(function(err) {
      console.log(err);
    });
  //console.log(otp);
}
