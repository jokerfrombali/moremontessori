const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

if (menuToggle && mobileMenu) {
  const setMenuOpen = (isOpen) => {
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.classList.toggle("open", isOpen);
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
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
