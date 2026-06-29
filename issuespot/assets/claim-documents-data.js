(function () {
  var panel = document.querySelector("[data-claim-documents]");
  if (!panel) return;

  var input = panel.querySelector("[data-claim-search]");
  var reason = panel.querySelector("[data-claim-reason]");
  var status = panel.querySelector("[data-claim-status]");
  var results = panel.querySelector("[data-claim-results]");
  var rows = [];

  fetch("/assets/data/post-insurance-claim-documents.json")
    .then(function (response) {
      if (!response.ok) throw new Error("데이터를 불러오지 못했습니다.");
      return response.json();
    })
    .then(function (data) {
      rows = Array.isArray(data) ? data : [];
      buildReasonOptions(rows);
      render();
    })
    .catch(function (error) {
      status.textContent = error.message;
    });

  input.addEventListener("input", render);
  reason.addEventListener("change", render);

  function buildReasonOptions(data) {
    var reasons = unique(data.map(function (row) { return row["청구사유"]; })).filter(Boolean);
    reasons.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      reason.appendChild(option);
    });
  }

  function render() {
    var keyword = input.value.trim().toLowerCase();
    var selectedReason = reason.value;
    var filtered = rows.filter(function (row) {
      var matchesReason = !selectedReason || row["청구사유"] === selectedReason;
      var haystack = [
        row["청구사유"],
        row["발생원인구분"],
        row["기본서류"],
        row["추가서류"],
        row["필요내용"],
        row["수익자 지정 시"],
        row["수익자 미지정시"],
      ].join(" ").toLowerCase();
      return matchesReason && (!keyword || haystack.indexOf(keyword) !== -1);
    });

    results.innerHTML = "";
    status.textContent = filtered.length + "건의 구비서류 자료가 있습니다.";

    filtered.slice(0, 8).forEach(function (row) {
      results.appendChild(createCard(row));
    });

    if (filtered.length > 8) {
      var note = document.createElement("p");
      note.className = "claim-data-note";
      note.textContent = "검색 결과가 많아 상위 8건만 표시합니다. 검색어를 더 구체적으로 입력하세요.";
      results.appendChild(note);
    }
  }

  function createCard(row) {
    var card = document.createElement("article");
    card.className = "claim-data-card";

    var title = document.createElement("h3");
    title.textContent = row["청구사유"] + " · " + row["발생원인구분"];
    card.appendChild(title);

    card.appendChild(field("기본서류", row["기본서류"]));
    card.appendChild(field("추가서류", row["추가서류"]));
    card.appendChild(field("필요내용", row["필요내용"]));
    card.appendChild(field("수익자 지정 시", row["수익자 지정 시"]));
    card.appendChild(field("수익자 미지정 시", row["수익자 미지정시"]));

    return card;
  }

  function field(label, value) {
    var wrap = document.createElement("div");
    var strong = document.createElement("strong");
    var p = document.createElement("p");
    strong.textContent = label;
    p.textContent = value || "해당사항 없음";
    wrap.appendChild(strong);
    wrap.appendChild(p);
    return wrap;
  }

  function unique(values) {
    return values.filter(function (value, index) {
      return value && values.indexOf(value) === index;
    });
  }
})();
