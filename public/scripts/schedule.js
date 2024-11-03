
function FormatHours(hours,minutes){
	if(hours == 0)  return `12:00am`;
	if(hours == 12) return `12:00pm`;
	if(hours == 24) return `11:59pm`;
	if(hours > 12)  return `${hours-12}:${minutes}pm`;
	else            return `${hours}:${minutes}am`;
}

function FormatDuration(minutes){
	return `${ minutes / 60 != 0 && minutes / 60 % 0 ? `${minutes / 60}h` : ``} ${minutes % 60 != 0 && minutes / 60 != 0 ? ` and ` : ``} ${minutes % 60 != 0 ? `${ minutes % 60}m` : ``}`;
}


function HandleScheduleActivities ({Days,RoutineActivities,UpdateUserDocByProperty}) {
	Object.keys(Days).forEach(
		(DayKey) => {
			let Day = Days[DayKey];
			let DayTab = document.getElementById(`${DayKey}-tab`);
			DayTab.innerHTML = "";
			Object.keys(Day.activities).forEach(
				(ActivityKey) => {
					function FormatTimeToMinutes(hours_and_minutes) {
						const [hours, minutes] = hours_and_minutes.split(':').map(Number);
						return (hours * 60) + minutes;
					}
	
					let activity = Day.activities[ActivityKey];
					let ActivityElement = document.createElement("div");
					ActivityElement.setAttribute("class","activity");
					ActivityElement.style.top = `calc(${(FormatTimeToMinutes(activity.time)/1440)*100}% + 0.1em)`;
					ActivityElement.style.height = `calc(${(activity.duration_minutes/1440)*100}% - 0.2em)`;
	
					ActivityElement.innerHTML = `
						<div class="horizontal-flex-container">
							<div class="filler">
								<div class="title">
									<b>${activity.name}</b>
									<span style="font-size:0.7em;">${activity.group}</span>
								</div>
								<div class="time">
									at ${FormatHours(activity.time.split(":")[0],activity.time.split(":")[1])} for ${FormatDuration(activity.duration_minutes)}
								</div>
								<div class="description">
									<b>*:</b> ${activity.description}
								</div>
							</div>
							<div class="buttons">
								<button class="done"        > <span> Finish        </span></button>
								<button class="cancel"      > <span> Cancel        </span></button>
								<button class="undo"        > <span> Undo          </span></button>
							</div>
						</div>
					`;
				
					let FinishingButton = ActivityElement.querySelector(`.done`);
					FinishingButton.onclick = () => {
						UpdateUserDocByProperty(`days.${DayKey}.activities.${ActivityKey}.done`, "finish");
					}
	
					let CancelButton =  ActivityElement.querySelector(`.cancel`);
					CancelButton.onclick = () => {
						if(! (RoutineActivities[ActivityKey]) ){
							delete Day.activities[ActivityKey];
							UpdateUserDocByProperty(`days.${DayKey}.activities`,Day.activities );
						} else{
							UpdateUserDocByProperty(`days.${DayKey}.activities.${ActivityKey}.done`, "cancel");
						}
					}
	
					let UndoButton =  ActivityElement.querySelector(`.undo`);
					UndoButton.onclick = () => {
						UpdateUserDocByProperty(`days.${DayKey}.activities.${ActivityKey}.done`, false);
					}
	
					if(activity.done){
						ActivityElement.querySelector(`.cancel`).hidden = true;
						ActivityElement.querySelector(`.done`).hidden = true;
					} 
	
					if(activity.done == "finish"){
						ActivityElement.style.color = "var(--dark-sliver-color)"
						ActivityElement.style.borderColor = "var(--light-gray-color)";
					}
	
					if(activity.done == "cancel"){
						ActivityElement.style.backgroundColor = "var(--dark-gray-color)";
						ActivityElement.style.color = "var(--dark-sliver-color)"
						ActivityElement.style.borderColor = "var(--light-gray-color)";    
						ActivityElement.style.border = "0.2em var(--light-gray-color) dashed";
						UndoButton.innerHTML = "<span>Uncancel</span>"
					}
	
					if (!activity.done){
						ActivityElement.style.backgroundColor = activity.background_color;
						if(activity.priority == "low") ActivityElement.style.borderColor = "white";
						if(activity.priority == "medium" ) ActivityElement.style.borderColor = "yellow";
						if(activity.priority == "high" ) ActivityElement.style.borderColor = "red";
	
						ActivityElement.querySelector(`.undo`).hidden = true;
					}
					
					DayTab.appendChild(ActivityElement);
				}
			);
		}
	);
}

function GenerateRoutineActivities({Days,RoutineActivities,UpdateUserDocByProperty}){
    Object.keys(Days).forEach(
        (DayKey) => {
            let Day = Days[DayKey];
    
            Object.keys(RoutineActivities).forEach(
                (routine_ActivityKey/* also the id */) => {
    
                    let routine_activity = RoutineActivities[routine_ActivityKey];
    
                    if(routine_activity.days[DayKey]){
    
                        let EditRoutine = () => {
                            UpdateUserDocByProperty(`days.${DayKey}.activities.${routine_ActivityKey}`,routine_activity.activity);
                        };
    
                        if(!Day.activities[routine_ActivityKey]){
                            EditRoutine();
                            return;
                        }
    
                        let checked_activity = Day.activities[routine_ActivityKey];
    
                        let temp_done = checked_activity.done;
    
                        if(
                            checked_activity.background_color != routine_activity.activity.background_color ||
                            checked_activity.description      != routine_activity.activity.description ||
                            checked_activity.duration_minutes != routine_activity.activity.duration_minutes ||
                            checked_activity.group            != routine_activity.activity.group ||
                            checked_activity.name             != routine_activity.activity.name ||
                            checked_activity.priority         != routine_activity.activity.priority ||
                            checked_activity.time             != routine_activity.activity.time 
                        )EditRoutine();
    
                        if(temp_done)UpdateUserDocByProperty(`days.${DayKey}.activities.${routine_ActivityKey}.done`,temp_done);
    
                    } else if(Day.activities[routine_ActivityKey] && !Day.activities[routine_ActivityKey].done){
    
                        delete Day.activities[routine_ActivityKey];
                    
                        UpdateUserDocByProperty(`days.${DayKey}`,Day);
                        return;
                    }
                }
            );
        }
    );
}