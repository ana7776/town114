(function () {
  var forms = document.querySelectorAll(".api-form");

  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var result = form.parentElement.querySelector(".api-result");
      var endpoint = form.getAttribute("data-endpoint");
      var params = new URLSearchParams(new FormData(form));

      params.set("pageNo", "1");
      params.set("resultType", "json");
      result.textContent = "\uacf5\uacf5\ub370\uc774\ud130\ub97c \uc870\ud68c\ud558\ub294 \uc911\uc785\ub2c8\ub2e4.";

      fetch(endpoint + "?" + params.toString(), {
        headers: {
          Accept: "application/json, text/plain;q=0.8",
        },
      })
        .then(function (response) {
          return response.text().then(function (text) {
            if (!response.ok) {
              throw new Error(text || "\uc870\ud68c\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.");
            }
            return text;
          });
        })
        .then(function (text) {
          result.textContent = formatResult(text);
        })
        .catch(function (error) {
          result.textContent = readableError(error.message);
        });
    });
  });

  function formatResult(text) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (error) {
      return text;
    }
  }

  function readableError(message) {
    try {
      var data = JSON.parse(message);
      if (data.message) return data.message;
      if (data.error) return "\uc870\ud68c \uc624\ub958: " + data.error;
    } catch (error) {
      return message;
    }

    return message;
  }
})();
