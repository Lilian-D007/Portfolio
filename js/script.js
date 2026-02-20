$(document).ready(function () {
    let currentSlide = 0;
    const slides = $(".slide");
    const totalSlides = slides.length;

    function showSlide(index) {
      slides.each(function (i) {
        const offset = (i - index) * 100;
        $(this).css("transform", "translateX(" + offset + "vw)");
      });
    }

    $("#next").click(function () {
      currentSlide = (currentSlide + 1) % totalSlides;
      showSlide(currentSlide);
    });

    $("#prev").click(function () {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      showSlide(currentSlide);
    });

    $(document).keydown(function(e) {
      if(e.key === "ArrowRight") { $("#next").click(); }
      if(e.key === "ArrowLeft") { $("#prev").click(); }
    });

    showSlide(currentSlide);
  });