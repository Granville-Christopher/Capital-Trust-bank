document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("creditScoreGauge");
  const creditScoreText = document.getElementById("creditscore-value");

  if (!canvas) {
    console.error("Canvas element for credit score not found.");
    return;
  }

  try {
    // ✅ Fetch credit score from backend
    const response = await fetch("/user/secure/ctb/creditscore", {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Unable to fetch credit score");

    const score = data.creditScore || 300;

    // ✅ Define ranges for gauge
    const ranges = [300, 580, 670, 740, 800, 900];
    const colors = ["#d32f2f", "#f57c00", "#fbc02d", "#388e3c", "#2e7d32"];
    const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

    // ✅ Determine which color to use based on score
    let activeColor = colors[0];
    for (let i = 0; i < ranges.length - 1; i++) {
      if (score >= ranges[i] && score < ranges[i + 1]) {
        activeColor = colors[i];
        break;
      }
    }

    // ✅ Chart.js half-doughnut gauge setup
    const gaugeChart = new Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: [1, 1, 1, 1, 1],
            backgroundColor: colors,
            borderWidth: 0,
            cutout: "75%",
            rotation: -90,
            circumference: 180,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        responsive: true,
        animation: { animateRotate: true, duration: 1200 },
      },
    });

    // ✅ Plugin to draw ONLY the base circle
    const baseCircle = {
      id: "baseCircle",
      afterDatasetDraw(chart) {
        const { ctx, chartArea: { width, height, top, left } } = chart;
        ctx.save();

        // ✅ Position circle at bottom center of the semicircle
        const cx = left + width / 2;
        const cy = top + height / 1.5;

        // ✅ Draw small circle that matches score color
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fillStyle = activeColor;  // dynamically changes based on score
        ctx.fill();

        // ✅ Add a thin border for a clean look
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#222";
        ctx.stroke();

        ctx.restore();
      },
    };

    // ✅ Register plugin
    Chart.register(baseCircle);

    // ✅ Display the credit score dynamically
    creditScoreText.textContent = score;
    creditScoreText.style.color = activeColor;

    // ✅ Add legend under chart
    const legend = document.getElementById("creditScoreLegend");
      
    legend.innerHTML = labels
      .map((label, i) => {
        const fullWidthClass = i >= 3 ? 'col-span-3 w-full text-center' : ''; 
        return `
          <div class="p-2 ${fullWidthClass}" style="color: ${colors[i]}; font-weight: bold; margin: 4px 0;">
            ${label}: ${ranges[i]} - ${ranges[i + 1] || ""}
          </div>
        `;
      })
      .join("");

  } catch (err) {
    console.error("Error fetching credit score:", err);
    creditScoreText.textContent = "Error loading credit score";
  }
});
