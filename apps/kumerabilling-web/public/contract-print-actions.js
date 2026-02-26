(function () {
  function doPrint() {
    window.print();
  }

  function bind(id, handler) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function (event) {
      event.preventDefault();
      handler();
    });
  }

  bind("print-btn", doPrint);
})();
