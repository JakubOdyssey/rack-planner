let pallets = JSON.parse(localStorage.getItem("pallets")) || [];
let plan = [];
// default pallet
if (pallets.length === 0) {
  pallets.push({
  name: "HA135SAHCR4",
  width: 59,
  depth: 61,
  height: 91,
  stackable: true,
  color: "#facc15"
});
}

save();
render();

function save() {
  localStorage.setItem("pallets", JSON.stringify(pallets));
}

function render() {
  let select = document.getElementById("palletSelect");
  select.innerHTML = "";

  pallets.forEach((p, i) => {
    let opt = document.createElement("option");
    opt.value = i;
    opt.textContent = p.name;
    select.appendChild(opt);
  });

  // locations
  let locDiv = document.getElementById("locations");
  locDiv.innerHTML = "";

  ["U01","U02","U03","U04","U05","U06","U07","U08",
 "W01","W02","W03","W04","W05","W06","W07","W08"]
.forEach(l => {
  ["Bottom","Top"].forEach(level => {
    let id = l + "-" + level;

    let wrapper = document.createElement("div");

    wrapper.innerHTML = `
  <label>
    <input type="checkbox" class="useLoc" value="${id}" onchange="updateSelectedLocations()">
    ${id}
  </label>

  <input 
    class="bayInput" 
    data-loc="${id}" 
    placeholder="Free bays e.g. 4"
    style="margin-top:5px; font-size:11px;"
  >
`;

    locDiv.appendChild(wrapper);
  });
});
}

function addPallet() {
  let name = document.getElementById("name").value.trim();
  let width = +document.getElementById("width").value;
  let depth = +document.getElementById("depth").value;
  let height = +document.getElementById("height").value;
  let stackable = document.getElementById("stackable").checked;

  if (!name) {
    alert("Pallet name is required.");
    return;
  }

  if (!width || !depth || !height) {
    alert("All dimensions must be filled.");
    return;
  }

  if (width <= 0 || depth <= 0 || height <= 0) {
    alert("Dimensions must be greater than 0.");
    return;
  }

  if (width > 300) {
    alert("Width seems too large. Check input.");
    return;
  }

  if (height > 250) {
    alert("Height exceeds typical rack limit.");
    return;
  }

  let colors = ["#facc15", "#38bdf8", "#fb7185", "#4ade80", "#c084fc", "#f97316"];

  let p = {
    name,
    width,
    depth,
    height,
    stackable,
    color: colors[pallets.length % colors.length]
  };

  pallets.push(p);
  save();
  render();

  // reset inputów
  document.getElementById("name").value = "";
  document.getElementById("width").value = "";
  document.getElementById("depth").value = "";
  document.getElementById("height").value = "";
}

function addToPlan() {
  let palletIndex = document.getElementById("palletSelect").value;
  let qty = +document.getElementById("quantity").value;

  if (!qty || qty <= 0) {
    alert("Enter valid quantity.");
    return;
  }

  if (qty > 10000) {
    alert("Quantity too large.");
    return;
  }

  let pallet = pallets[palletIndex];

  plan.push({
    ...pallet,
    qty
  });

  renderPlan();

  document.getElementById("quantity").value = "";
}

function generate() {
      let loading = document.getElementById("loading");
  loading.classList.remove("hidden");

  let items = [...plan]
  .map(p => ({ ...p }))
  .sort((a, b) => {
    let sizeA = a.width * a.depth * a.height;
    let sizeB = b.width * b.depth * b.height;
    return sizeB - sizeA;
  });

let totalQty = items.reduce((sum, p) => sum + p.qty, 0);

  let selected = [...document.querySelectorAll(".useLoc:checked")].map(el => {
  let loc = el.value;

  let input = document.querySelector(`.bayInput[data-loc="${loc}"]`);
  let bays = [];

  if (input && input.value.trim() !== "") {
  let bayCountInput = parseInt(input.value.trim());

  if (!isNaN(bayCountInput) && bayCountInput > 0) {
    bays = bayCountInput;
  }
}

  return {
    loc,
    bays // np [1,2,3]
  };
});

  let occupied = [...document.querySelectorAll(".occupied:checked")]
    .map(x => x.value);

  let result = "";
let visual = document.getElementById("visual");
let legend = document.getElementById("legend");
let reportCards = document.getElementById("reportCards");

visual.innerHTML = "";
legend.innerHTML = "";
reportCards.innerHTML = "";

let unique = {};

items.forEach(p => {
  unique[p.name] = p.color;
});

Object.entries(unique).forEach(([name, color]) => {
  let row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "8px";
  row.style.marginBottom = "4px";

  let box = document.createElement("div");
  box.style.width = "14px";
  box.style.height = "14px";
  box.style.background = color;
  box.style.borderRadius = "3px";

  let text = document.createElement("span");
  text.textContent = name;

  row.appendChild(box);
  row.appendChild(text);
  legend.appendChild(row);
});

  if (items.length === 0) {
    document.getElementById("result").textContent = "Add at least one pallet to the plan first.";
    return;
  }

  if (selected.length === 0) {
    document.getElementById("result").textContent = "Select at least one rack location first.";
    return;
  }

  let remaining = totalQty;
  let usedBays = 0;

  selected.forEach(entry => {
  let loc = entry.loc;
  let allowedBays = entry.bays;


    let isU = loc.startsWith("U");

    let bayWidth = isU ? 288 : 257;
    let bayCount = isU ? 9 : 8;
    let heightLimit = isU ? 187 : 193;

    let locationUsedBays = 0;
    let locationPlaced = 0;

    let section = document.createElement("div");
    section.className = "location-section";
    section.innerHTML = `
      <div class="location-header">
        <h3>${loc}</h3>
        <span class="location-stats" id="stats-${loc}">Calculating...</span>
      </div>
    `;
    visual.appendChild(section);

    let baysToUse;

    if (typeof allowedBays === "number" && allowedBays > 0) {
    let safeCount = Math.min(allowedBays, bayCount);
    baysToUse = [...Array(safeCount)].map((_, i) => i + 1);
    } else {
    baysToUse = [...Array(bayCount)].map((_, i) => i + 1);
    }

        for (let i of baysToUse) {
      if (remaining <= 0) break;

      let bay = document.createElement("div");
    bay.className = "bay";

    let slots = document.createElement("div");
    slots.className = "slots";

    let spaceLeft = bayWidth;
    let bayPlaced = 0;
    let bayItems = {};

      while (spaceLeft > 0 && remaining > 0) {
        let placedSomething = false;

        let bestItem = null;
        let bestLeftover = Infinity;

    for (let item of items) {
  if (item.qty <= 0) continue;
  if (item.width > spaceLeft) continue;
  if (item.depth > 100) continue;
  if (item.height > heightLimit) continue;

  let leftover = spaceLeft - item.width;

  if (leftover < bestLeftover) {
    bestLeftover = leftover;
    bestItem = item;
  }
}

if (bestItem) {
  let stack = 1;

  if (bestItem.stackable && bestItem.height * 2 <= heightLimit && bestItem.qty >= 2) {
    stack = 2;
  }

  let stackDiv = document.createElement("div");
  stackDiv.className = "stack";

  let placedInStack = 0;

  for (let h = 0; h < stack; h++) {
    if (bestItem.qty <= 0) break;

    let slot = document.createElement("div");
    slot.className = "slot filled";
    slot.title = bestItem.name;
    slot.style.backgroundColor = bestItem.color || "#facc15";

    stackDiv.appendChild(slot);

    bestItem.qty--;
    remaining--;
    bayPlaced++;
    placedInStack++;

    if (!bayItems[bestItem.name]) {
     bayItems[bestItem.name] = 0;
    }

    bayItems[bestItem.name]++;
  }

  if (placedInStack > 0) {
    slots.appendChild(stackDiv);
    spaceLeft -= bestItem.width;
    placedSomething = true;
  }
}

        if (!placedSomething) break;
      }

      if (bayPlaced > 0) {
        usedBays++;
        locationUsedBays++;
        locationPlaced += bayPlaced;

        let bayContents = Object.entries(bayItems)
  .map(([name, qty]) => `${name} x ${qty}`)
  .join(" + ");

bay.dataset.contents = bayContents;

bay.innerHTML = `<strong>Bay ${i}</strong> <span>${bayContents}</span>`;
bay.appendChild(slots);

bay.onclick = function () {
  document.querySelectorAll(".bay").forEach(b => b.classList.remove("active-bay"));
  bay.classList.add("active-bay");

  showBayDetails(loc, i, bayItems, bayPlaced);
};

section.appendChild(bay);
      }
    }

    let locationEfficiency = Math.round((locationUsedBays / bayCount) * 100);
    let stats = document.getElementById(`stats-${loc}`);

    if (stats) {
      stats.textContent = `${locationPlaced} pallets • ${locationUsedBays}/${bayCount} bays • ${locationEfficiency}% used`;
    }
  });

  let totalBays = selected.reduce((acc, loc) => {
    if (occupied.includes(loc)) return acc;
    return acc + (loc.startsWith("U") ? 9 : 8);
  }, 0);

  let efficiency = totalBays > 0 ? Math.round((usedBays / totalBays) * 100) : 0;

  let placed = totalQty - remaining;
let freeBays = totalBays - usedBays;
let status = remaining === 0 ? "COMPLETE" : "OVERFLOW";

reportCards.innerHTML = `
  <div class="report-card">
    <span>Status</span>
    <strong class="${status === "COMPLETE" ? "status-good" : "status-bad"}">${status}</strong>
  </div>

  <div class="report-card">
    <span>Total pallets</span>
    <strong>${totalQty}</strong>
  </div>

  <div class="report-card">
    <span>Placed</span>
    <strong>${placed}</strong>
  </div>

  <div class="report-card">
    <span>Overflow</span>
    <strong class="${remaining > 0 ? "status-bad" : "status-good"}">${remaining}</strong>
  </div>

  <div class="report-card">
    <span>Used bays</span>
    <strong>${usedBays} / ${totalBays}</strong>
  </div>

  <div class="report-card">
    <span>Free bays</span>
    <strong>${freeBays}</strong>
  </div>

  <div class="report-card">
    <span>Efficiency</span>
    <strong>${efficiency}%</strong>
  </div>
`;

result += remaining > 0
  ? `WARNING: ${remaining} pallet(s) could not be placed. More rack space is required.`
  : `All pallets were placed successfully.`;

document.getElementById("result").textContent = result;
loading.classList.add("hidden");
}

function renderPlan() {
  let list = document.getElementById("planList");
  list.innerHTML = "";

  plan.forEach((p, i) => {
    let li = document.createElement("li");

    li.innerHTML = `
  <span>${p.name}</span>
  <input type="number" value="${p.qty}" min="1" onchange="updateQty(${i}, this.value)" class="qty-input">
  <button onclick="removeFromPlan(${i})" class="remove-btn">Remove</button>
`;

    list.appendChild(li);
  });
}

function removeFromPlan(index) {
  plan.splice(index, 1);
  renderPlan();

  document.getElementById("visual").innerHTML = "";
  document.getElementById("legend").innerHTML = "";
  document.getElementById("result").textContent = "";
}

function updateQty(index, newQty) {
  plan[index].qty = +newQty;

  document.getElementById("visual").innerHTML = "";
  document.getElementById("legend").innerHTML = "";
  document.getElementById("result").textContent = "";
}

function resetApp() {
  let confirmReset = confirm("Are you sure? This will delete all saved pallet types.");

  if (!confirmReset) return;

  localStorage.removeItem("pallets");
  location.reload();
}

function showBayDetails(location, bayNumber, bayItems, total) {
  let details = document.getElementById("bayDetails");

  let html = `<h3>${location} / Bay ${bayNumber}</h3>`;
  html += `<p>Total pallets: ${total}</p>`;
  html += `<ul>`;

  Object.entries(bayItems).forEach(([name, qty]) => {
    html += `<li>${name} x ${qty}</li>`;
  });

  html += `</ul>`;

  details.innerHTML = html;
}

function printPlan() {
  window.print();
}

function suggestLocation() {
  let items = [...plan].map(p => ({ ...p }));
  let totalQty = items.reduce((sum, p) => sum + p.qty, 0);

  if (items.length === 0 || totalQty === 0) {
    alert("Add pallets to the plan first.");
    return;
  }

  let allLocations = [
    "U01-Bottom","U01-Top","U02-Bottom","U02-Top","U03-Bottom","U03-Top","U04-Bottom","U04-Top",
    "U05-Bottom","U05-Top","U06-Bottom","U06-Top","U07-Bottom","U07-Top","U08-Bottom","U08-Top",
    "W01-Bottom","W01-Top","W02-Bottom","W02-Top","W03-Bottom","W03-Top","W04-Bottom","W04-Top",
    "W05-Bottom","W05-Top","W06-Bottom","W06-Top","W07-Bottom","W07-Top","W08-Bottom","W08-Top"
  ];

  let locationScores = allLocations.map(loc => {
    let isU = loc.startsWith("U");

    let bayWidth = isU ? 288 : 257;
    let bayCount = isU ? 9 : 8;
    let heightLimit = isU ? 187 : 193;

    let capacity = 0;

    items.forEach(item => {
      if (item.depth > 100 || item.height > heightLimit) return;

      let perRow = Math.floor(bayWidth / item.width);

      let stack = 1;
      if (item.stackable && item.height * 2 <= heightLimit) {
        stack = 2;
      }

      capacity += perRow * stack * bayCount;
    });

    return {
      loc,
      capacity
    };
  });

  locationScores.sort((a, b) => b.capacity - a.capacity);

  document.querySelectorAll(".useLoc").forEach(el => el.checked = false);

  let needed = totalQty;
  let selectedLocations = [];

  for (let item of locationScores) {
    if (needed <= 0) break;
    if (item.capacity <= 0) continue;

    selectedLocations.push(item.loc);
    needed -= item.capacity;
  }

  document.querySelectorAll(".useLoc").forEach(el => {
    if (selectedLocations.includes(el.value)) {
      el.checked = true;
    }
  });

  updateSelectedLocations();
  alert(`Suggested ${selectedLocations.length} location(s). Estimated remaining pallets: ${Math.max(0, needed)}.`);
}

function savePlan() {
  if (plan.length === 0) {
    alert("Nothing to save.");
    return;
  }

  let name = prompt("Enter plan name:");
  if (!name) return;

  let saved = JSON.parse(localStorage.getItem("savedPlans")) || {};

  saved[name] = plan;

  localStorage.setItem("savedPlans", JSON.stringify(saved));

  alert("Plan saved.");
}

function loadPlan() {
  let saved = JSON.parse(localStorage.getItem("savedPlans")) || {};

  let names = Object.keys(saved);

  if (names.length === 0) {
    alert("No saved plans.");
    return;
  }

  let name = prompt("Available plans:\n" + names.join("\n") + "\n\nType name to load:");

  if (!name || !saved[name]) {
    alert("Plan not found.");
    return;
  }

  plan = saved[name];
  renderPlan();

  document.getElementById("visual").innerHTML = "";
  document.getElementById("legend").innerHTML = "";
  document.getElementById("result").textContent = "";

  alert("Plan loaded.");
}

function exportPDF() {
  let sections = document.querySelectorAll(".location-section");
  let resultText = document.getElementById("result").textContent;

  if (sections.length === 0) {
    alert("Generate a plan first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  let total = plan.reduce((sum, p) => sum + p.qty, 0);
  let today = new Date().toLocaleString();

  let pageWidth = 210;
  let margin = 14;
  let y = 16;

  function addPageIfNeeded(spaceNeeded = 12) {
    if (y + spaceNeeded > 285) {
      doc.addPage();
      y = 16;
    }
  }

  function line() {
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // HEADER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Rack Plan", pageWidth / 2, y, { align: "center" });

  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Generated pallet placement plan for warehouse operation", pageWidth / 2, y, { align: "center" });

  y += 6;
  doc.text(`Generated: ${today}`, pageWidth / 2, y, { align: "center" });

  y += 8;
  line();

  // SUMMARY BOX
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Summary", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let summaryLines = resultText.split("\n");

  summaryLines.forEach(lineText => {
    addPageIfNeeded(6);
    doc.text(lineText, margin, y);
    y += 5;
  });

  y += 5;
  line();

  // PALLET LEGEND
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Pallet Types", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  plan.forEach(p => {
    addPageIfNeeded(6);
    doc.text(`${p.name} — ${p.width}w x ${p.depth}d x ${p.height}h cm — Qty: ${p.qty}`, margin, y);
    y += 5;
  });

  y += 5;
  line();

  // RACK PLAN
  sections.forEach(section => {
    let location = section.querySelector("h3")?.textContent || "Location";
    let bays = section.querySelectorAll(".bay");

    addPageIfNeeded(20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(location, margin, y);
    y += 8;

    // Table header
    doc.setFontSize(10);
    doc.setFillColor(235, 235, 235);
    doc.rect(margin, y - 5, 182, 8, "F");

    doc.text("Bay", margin + 2, y);
    doc.text("Instruction", margin + 38, y);
    doc.text("Check", margin + 165, y);

    y += 5;
    doc.setDrawColor(160);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    bays.forEach(bay => {
      addPageIfNeeded(10);

      let bayName = bay.querySelector("strong")?.textContent || "";
        let contents = bay.dataset.contents || bay.querySelector("span")?.textContent || "";

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        doc.text(bayName, margin + 2, y);

        let instruction = contents ? `Place: ${contents}` : "Empty";
        let wrappedInstruction = doc.splitTextToSize(instruction, 115);

        doc.text(wrappedInstruction, margin + 38, y);

      // checkbox
      doc.rect(margin + 166, y - 4, 5, 5);

      y += Math.max(7, wrappedInstruction.length * 5);
    });

    y += 5;
  });

  // FOOTER NOTE
  addPageIfNeeded(18);
  line();

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Note: Use this plan as a placement guide. Confirm rack availability before moving pallets.", margin, y);

  doc.save(`RackPlan_${total}_pallets.pdf`);
}

function updateSelectedLocations() {
  let selected = [...document.querySelectorAll(".useLoc:checked")]
    .map(x => x.value);

  let box = document.getElementById("selectedLocations");

  if (!box) return;

  if (selected.length === 0) {
    box.textContent = "Selected locations: none";
  } else {
    box.textContent = "Selected locations: " + selected.join(", ");
  }
}

document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 500);
  });
});