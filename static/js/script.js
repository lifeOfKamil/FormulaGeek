function fetchLapData() {
	const driver1 = $("#driver1").val();
	const driver2 = $("#driver2").val();
	const session = $("#session").val();

	$.ajax({
		url: "/get_lap_data",
		method: "POST",
		contentType: "application/json",
		data: JSON.stringify({
			year: 2024,
			race: "Austrian Grand Prix", // You can modify this to be dynamic as well
			session: session,
			driver1: driver1,
			driver2: driver2,
		}),
		success: function (response) {
			const lapTimesDriver1 = response.filter((item) => item.Driver === driver1);
			const lapTimesDriver2 = response.filter((item) => item.Driver === driver2);

			const trace1 = {
				x: lapTimesDriver1.map((item) => item.Lap),
				y: lapTimesDriver1.map((item) => item["Lap Time"]),
				mode: "lines",
				name: driver1,
			};

			const trace2 = {
				x: lapTimesDriver2.map((item) => item.Lap),
				y: lapTimesDriver2.map((item) => item["Lap Time"]),
				mode: "lines",
				name: driver2,
			};

			const data = [trace1, trace2];

			const layout = {
				title: "Lap Times Comparison",
				xaxis: { title: "Lap" },
				yaxis: { title: "Lap Time (s)" },
			};

			Plotly.newPlot("plot", data, layout);
		},
	});
}

function fetchRaceResults() {
	console.log("Fetching race results");

	$.ajax({
		url: "/get_race_results",
		method: "POST",
		contentType: "application/json",
		data: JSON.stringify({
			year: 2024,
			race: "Austria", // You can modify this to be dynamic as well
		}),
		success: function (response) {
			console.log("Received race results:", response);
			const tbody = $("#raceResultsTable tbody");
			tbody.empty();

			response.forEach((row) => {
				let formattedTime = row.Time !== null ? formatTime(row.Time) : "";
				if (row.Position !== 1 && formattedTime) {
					formattedTime = "+" + formattedTime;
				}
				const tr = $("<tr></tr>");
				tr.append(`<td>${row.Position}</td>`);
				tr.append(`<td>${row.Abbreviation}</td>`);
				tr.append(`<td>${formattedTime}</td>`);
				tr.append(`<td>${row.Points}</td>`);
				tbody.append(tr);
			});
		},
		error: function (xhr, status, error) {
			console.error("Error fetching race results:", error);
		},
	});
}

$(document).ready(function () {
	$("#updateButton").click(fetchLapData);
	$("#getResultsButton").click(fetchRaceResults);
});

function formatTime(value) {
	if (typeof value === "number") {
		const milliseconds = Math.floor((value % 1) * 1000);
		const totalSeconds = Math.floor(value);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const secs = totalSeconds % 60;

		return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${milliseconds
			.toString()
			.padStart(3, "0")}`;
	}
	return value; // Return the string value as is
}
