const leadForm = document.querySelector(".lead-form");

if (leadForm) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(leadForm);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const age = String(data.get("age") || "").trim();

    const message = [
      "Здравствуйте! Хочу записаться на знакомство в садик Море Монтессори.",
      name ? `Имя: ${name}` : "",
      phone ? `Телефон: ${phone}` : "",
      age ? `Возраст ребенка: ${age}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `https://wa.me/79628882450?text=${encodeURIComponent(message)}`;
  });
}

const spaceSlider = document.querySelector(".space-slider");

if (spaceSlider) {
  const slides = Array.from(spaceSlider.querySelectorAll(".space-slides img"));
  const dotsWrap = spaceSlider.querySelector(".slider-dots");
  const prev = spaceSlider.querySelector(".slider-btn.prev");
  const next = spaceSlider.querySelector(".slider-btn.next");
  let current = 0;
  let timerId;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Показать фото ${index + 1}`);
    dotsWrap.append(dot);
    return dot;
  });

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === current);
    });
  };

  const startTimer = () => {
    window.clearInterval(timerId);
    timerId = window.setInterval(() => showSlide(current + 1), 4200);
  };

  prev.addEventListener("click", () => {
    showSlide(current - 1);
    startTimer();
  });

  next.addEventListener("click", () => {
    showSlide(current + 1);
    startTimer();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      startTimer();
    });
  });

  showSlide(0);
  startTimer();
}
