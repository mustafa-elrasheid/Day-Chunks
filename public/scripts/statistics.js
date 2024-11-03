

function ShowStatistics ({RoutineActivities,Days,SortedRoutineActivitiesKeys}){
	let ThisWeekStatusElement = document.getElementById("this-week-status");
	ThisWeekStatusElement.innerHTML = "<h2>This Week's Progress</h2>";

	SortedRoutineActivitiesKeys.forEach(
		(RoutineActivityKey) => {
			let RoutineActivity = RoutineActivities[RoutineActivityKey];

			let ActivityStatusElement = document.createElement("div");
			ActivityStatusElement.setAttribute("class","routine-checkup");
			ActivityStatusElement.style.backgroundColor = RoutineActivity.activity.background_color;
			ActivityStatusElement.innerHTML += `
				<div>
					<h3>${RoutineActivity.activity.name} from ${RoutineActivity.activity.group}</h3>
				</div>
				<div class="horizontal-flex-container checks-container">
				</div>
			`;

			["sun","mon","tue","wed","thu","fri","sat"].forEach(
				(DayKey,Index) => {
					let ChecksContainer = ActivityStatusElement.querySelector(".checks-container");
					let Check = document.createElement("div");

					if(!RoutineActivity.days[DayKey]){
						Check.setAttribute("class","filler");
						ChecksContainer.appendChild(Check);
						return;
                    }

					Check.setAttribute("class","check filler");
					if(Index > (new Date()).getDay() && Days[DayKey].activities[RoutineActivityKey]){
						Check.style.background = "var(--dark-gray-color)";
						ChecksContainer.appendChild(Check);
						return;
					}

					if(Days[DayKey].activities[RoutineActivityKey].done == "finish" || Days[DayKey].activities[RoutineActivityKey].done === true) Check.style.background = "limegreen";
					if(Days[DayKey].activities[RoutineActivityKey].done == "cancel") Check.style.background = "var(--dark-gray-color)";
					if(!Days[DayKey].activities[RoutineActivityKey].done) Check.style.background = "red";

					ChecksContainer.appendChild(Check);

				}
			);
			ThisWeekStatusElement.appendChild(ActivityStatusElement);
		}
	);
}