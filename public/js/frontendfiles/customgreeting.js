const greetingElement = document.getElementById("greeting");
const hours = new Date().getHours();

let customGreeting = "Welcome";

if (hours < 12) {
  customGreeting = "Good morning";
} else if (hours < 17) {
  customGreeting = "Good afternoon";
} else {
  customGreeting = "Good evening";
}

greetingElement.textContent = `${customGreeting}`;
