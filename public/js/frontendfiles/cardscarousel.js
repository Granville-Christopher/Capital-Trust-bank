let creditCurrentIndex = 0;
const creditSlides = document.querySelectorAll("#creditCarouselSlides > div");
const creditDots = document.querySelectorAll(".credit-carousel-dot");

function showCreditSlide(index) {
  creditSlides.forEach((slide, i) => {
    slide.classList.toggle("hidden", i !== index);
    if (creditDots[i]) {
      creditDots[i].classList.toggle("opacity-100", i === index);
      creditDots[i].classList.toggle("opacity-50", i !== index);
    }
  });
  creditCurrentIndex = index;
}

function autoCreditSlide() {
  creditCurrentIndex = (creditCurrentIndex + 1) % creditSlides.length;
  showCreditSlide(creditCurrentIndex);
}

let debitCurrentIndex = 0;
const debitSlides = document.querySelectorAll("#debitCarouselSlides > div");
const debitDots = document.querySelectorAll(".debit-carousel-dot");

function showDebitSlide(index) {
  debitSlides.forEach((slide, i) => {
    slide.classList.toggle("hidden", i !== index);
    if (debitDots[i]) {
      debitDots[i].classList.toggle("opacity-100", i === index);
      debitDots[i].classList.toggle("opacity-50", i !== index);
    }
  });
  debitCurrentIndex = index;
}

function autoDebitSlide() {
  debitCurrentIndex = (debitCurrentIndex + 1) % debitSlides.length;
  showDebitSlide(debitCurrentIndex);
}

// Initialize first slides and start auto sliding
window.onload = () => {
  showCreditSlide(creditCurrentIndex);
  showDebitSlide(debitCurrentIndex);
  setInterval(autoCreditSlide, 20000);
  setInterval(autoDebitSlide, 20000);
};
