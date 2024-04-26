/*
 * WARNING: This is copyrighted content.
 *
 * Owner: Mustafa El-rasheid
 * All rights reserved.
 */

let unsubscribe;

function InitializeApp(){

	InitializeUI();

	let App;
	let Auth;
	let DataBase;
	let Provider;
	// firebase SDK
	try {
		App = firebase.app();
		Auth = firebase.auth();
		DataBase = firebase.firestore();
		GoogleProvider = new firebase.auth.GoogleAuthProvider();
	} catch (error) {
		console.error(error);
	}


	let WeekEndDay = 6;

	// grabing elements to add functality to theme
	let MainSectionSignIn           = document.getElementById("main-signed-in");
	let MainSectionSignOut          = document.getElementById("main-signed-out");
	let MainLoading                 = document.getElementById("main-loading");

	let SignInGoogleButton          = document.getElementById("sign-in-google-button");
		SignInGoogleButton.onclick  = () => Auth.signInWithPopup(GoogleProvider);
	let SignOutButton               = document.getElementById("sign-out-button");
		SignOutButton.onclick       = () => Auth.signOut();
	let SignInEmailButton           = document.getElementById("sing-in-email").querySelector("input[type='submit']");
		SignInEmailButton.onclick   = () => {
			let email = "example@gmail.com";
			let password = "8w4#$njfs98";
			Auth.signInWithEmailAndPassword(email,password);
			
		}

	let sign_in_releated_elements = [SignOutButton,MainSectionSignIn];
	let sign_out_releated_elements = [MainSectionSignOut];
	let loading_related_elements = [MainLoading];

	window.addEventListener('beforeunload', () => {if(unsubscribe) unsubscribe();});
	Auth.onAuthStateChanged(
		user => {

			function TurnHiddenPropery(elements,value) {
				elements.forEach(element => {
					element.hidden = value;
				});
			}

			if (!user) {
				TurnHiddenPropery(sign_out_releated_elements,false);
				TurnHiddenPropery(sign_in_releated_elements,true);
				TurnHiddenPropery(loading_related_elements,true);
				if (unsubscribe) unsubscribe();
				return;
			}

			function NearestWeekEndDay(date,weekend_day){
				for(;date.getDay() != weekend_day;date.setDate(date.getDate()+1));
				return date;
			}
		
			TurnHiddenPropery(sign_out_releated_elements,true);
			TurnHiddenPropery(sign_in_releated_elements,false);
			TurnHiddenPropery(loading_related_elements,true);

			let UserDocumentRefrence = DataBase.collection("users").doc(user.uid);

			// fetch user's data, if found nothing, it will create a template
			unsubscribe = UserDocumentRefrence.onSnapshot(
				(_DocumentMetaData)=>{

					let DefualtActivities = {
						sun:{activities:{}},
						mon:{activities:{}},
						tue:{activities:{}},
						wed:{activities:{}},
						thu:{activities:{}},
						fri:{activities:{}},
						sat:{activities:{}}
					};

					function FetchData (DocumentMetaData) {
						return new Promise(
							(resolve) => {

								if(DocumentMetaData.exists) return resolve(DocumentMetaData.data());
								if(!DocumentMetaData.exists) UserDocumentRefrence.set(
									{
										week_end_day:NearestWeekEndDay(new Date(),WeekEndDay),
										days:DefualtActivities,
										routine_activities:{}
									}
								);

								return resolve(DocumentMetaData.data());
							}
						);
					};

					FetchData(_DocumentMetaData).then(
						(Data)=>{
							let IsWeekOver = new Date().setHours(0,0,0,0) > new Date(Data.week_end_day.seconds * 1000).setHours(0,0,0,0);
							if(IsWeekOver){
								UserDocumentRefrence.update({week_end_day:NearestWeekEndDay(new Date(),WeekEndDay)});
								UserDocumentRefrence.update({days:DefualtActivities});
							}

							let UpdateDataByProperty = (property,data) => {
								let UpdatedData = {};
								UpdatedData[property] = data;
								UserDocumentRefrence.update(UpdatedData);
							}

							Object.keys(Data.days).forEach(
								(day_key) => {

									let DayData = Data.days[day_key];
									let DayTab = document.getElementById(`${day_key}-tab`);
									DayTab.innerHTML = "";

									Object.keys(DayData.activities).forEach(
										(activity_key) => {

											function FormatTimeToMinutes(hours_and_minutes) {
												const [hours, minutes] = hours_and_minutes.split(':').map(Number);
												return (hours * 60) + minutes;
											}

											
											let activity = DayData.activities[activity_key];
										
											let ActivityElement = document.createElement("div");
											ActivityElement.setAttribute("class","activity");
											ActivityElement.style.top = `calc(${(FormatTimeToMinutes(activity.time)/1440)*100}% + 0.1em)`;
											ActivityElement.style.height = `calc(${(activity.duration_minutes/1440)*100}% - 0.2em)`;
											
											if(activity.done){
												ActivityElement.style.color = "var(--dark-sliver-color)"
												ActivityElement.style.borderColor = "var(--light-gray-color)";
											} else {
												ActivityElement.style.backgroundColor = activity.background_color;
												if(activity.priority == "low") ActivityElement.style.borderColor = "white";
												if(activity.priority == "medium" ) ActivityElement.style.borderColor = "yellow";
												if(activity.priority == "high" ) ActivityElement.style.borderColor = "red";
											}

											ActivityElement.innerHTML = `
												<div class="horizontal-flex-container">
													<span>
														<b>${activity.name}</b>
														<span>from ${activity.group}</span>
													</span>
													<div class="filler"></div>
													<button id="done"></button>
												</div>
												<div>
													at ${activity.time}
													for ${activity.duration_minutes} minutes
												</div>
												<div>
													Description: ${activity.description}
												</div>
											`;
										
										
											let FinishingButton = ActivityElement.querySelector(`#done`);
											FinishingButton.addEventListener(
												"click",
												(Element)=>{
													UpdateDataByProperty(`days.${day_key}.activities.${activity_key}.done`,!activity.done);
												}
											);
											FinishingButton.innerHTML = !activity.done ? "Finish" : "Undo";
											
											DayTab.appendChild(ActivityElement);
											
										}
									);
								}
							);
							
							let RoutineActivitiesEditor = document.getElementById("routine-activities-editor");
							RoutineActivitiesEditor.innerHTML = "";

							Object.keys(Data.routine_activities).forEach(
								(routine_activity_key/* also the id */) => {
									let routine_activity = Data.routine_activities[routine_activity_key];
									Object.keys(Data.days).forEach(
										(day_key) => {
											let DayData = Data.days[day_key]; /* list of activities */
											if(routine_activity.days[day_key]){

												let EditRoutine = () => {
													UpdateDataByProperty(`days.${day_key}.activities.${routine_activity_key}`,routine_activity.activity);
												};

												if(!DayData.activities[routine_activity_key]){
													EditRoutine();
													return;
												}

												let checked_activity = DayData.activities[routine_activity_key];

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

												if(temp_done)UpdateDataByProperty(`days.${day_key}.activities.${routine_activity_key}.done`,true);
											}
										}
									);

									let RoutineActivityEditor = document.createElement("div");
									RoutineActivityEditor.setAttribute("class","routine-activity-editor");
									RoutineActivityEditor.style.backgroundColor = routine_activity.activity.background_color;
									if(routine_activity.activity.priority == "low") RoutineActivityEditor.style.borderColor = "white";
									if(routine_activity.activity.priority == "medium" ) RoutineActivityEditor.style.borderColor = "yellow";
									if(routine_activity.activity.priority == "high" ) RoutineActivityEditor.style.borderColor = "red";
									RoutineActivityEditor.innerHTML = `
																				
										<div class="feild horizontal-flex-container">
											<button id="open-activity-creator" class="routine_activities.${routine_activity_key}">
												<img src="icons/arrow.svg" />
											</button>
											<h2 style="display:inline;"> ${routine_activity.activity.name} from ${routine_activity.activity.group}</h2>
										</div>
										<div id="routine-activities-creator-feilds-container" style="grid-template-rows: 0fr;">
											<div>
												<div class="feild">
														<table>
															<tbody>
																<tr>
																	<td><label >Sun</label></td>
																	<td><label >Mon</label></td>
																	<td><label >Tue</label></td>
																	<td><label >Wed</label></td>
																	<td><label >Thu</label></td>
																	<td><label >Fri</label></td>
																	<td><label >Sat</label></td>
																</tr>
																<tr>
																	<td><input ${routine_activity.days.sun ? "checked" : ""} type="checkbox" name="sun" id="sun"></td>
																	<td><input ${routine_activity.days.mon ? "checked" : ""} type="checkbox" name="mon" id="mon"></td>
																	<td><input ${routine_activity.days.tue ? "checked" : ""} type="checkbox" name="tue" id="tue"></td>
																	<td><input ${routine_activity.days.wed ? "checked" : ""} type="checkbox" name="wed" id="wed"></td>
																	<td><input ${routine_activity.days.thu ? "checked" : ""} type="checkbox" name="thu" id="thu"></td>
																	<td><input ${routine_activity.days.fri ? "checked" : ""} type="checkbox" name="fri" id="fri"></td>
																	<td><input ${routine_activity.days.sat ? "checked" : ""} type="checkbox" name="sat" id="sat"></td>
																</tr>
															</tbody>
														</table>
													</div>
													<div class="feild horizontal-flex-container">
														<label>Name</label>
														<input placeholder="Title" class="filler" type="text" name="name" value="${routine_activity.activity.name}">
													</div>
													<div class="feild horizontal-flex-container">
														<label  for="activity-time">Time</label>
														<input placeholder="HH 24H format" class="filler" name="time_h" type="number" value="${routine_activity.activity.time.split(":")[0]}" >
														<span>:</span>
														<input placeholder="MM" class="filler" name="time_m" type="number" value="${routine_activity.activity.time.split(":")[1]}" >
													</div>
													<div class="feild horizontal-flex-container">
														<label>Duration</label>
														<input placeholder="Duration in munites" class="filler" type="number" name="duration_minutes" value="${routine_activity.activity.duration_minutes}" >
													</div>
													<div class="feild horizontal-flex-container">
														<label>Group</label>
														<input placeholder="Related for" class="filler" type="text" name="group" value="${routine_activity.activity.group}">
													</div>
													
													<div class="feild horizontal-flex-container">
														<label>Description</label>
														<input placeholder="More details" class="filler" type="text" name="description"  value="${routine_activity.activity.description}">
													</div>
													<div class="feild horizontal-flex-container">
														<label>Color</label>
														<select class="filler" name="background_color">
															<option value ="#46474Dff" style="background-color: #46474Dff;" ${routine_activity.activity.background_color == "#46474Dff" ? "selected" : ""}>Gray</option>
															<option value ="#4d2c2cff" style="background-color: #4d2c2cff;" ${routine_activity.activity.background_color == "#4d2c2cff" ? "selected" : ""}>Red</option>
															<option value ="#4d392cff" style="background-color: #4d392cff;" ${routine_activity.activity.background_color == "#4d392cff" ? "selected" : ""}>Orange</option>
															<option value ="#4d452cff" style="background-color: #4d452cff;" ${routine_activity.activity.background_color == "#4d452cff" ? "selected" : ""}>Yellow</option>
															<option value ="#2d4d3eff" style="background-color: #2d4d3eff;" ${routine_activity.activity.background_color == "#2d4d3eff" ? "selected" : ""}>Green</option>
															<option value ="#324146ff" style="background-color: #324146ff;" ${routine_activity.activity.background_color == "#324146ff" ? "selected" : ""}>Cyan</option>
															<option value ="#36354dff" style="background-color: #36354dff;" ${routine_activity.activity.background_color == "#36354dff" ? "selected" : ""}>Blue</option>
															<option value ="#42313dff" style="background-color: #42313dff;" ${routine_activity.activity.background_color == "#42313dff" ? "selected" : ""}>Purple</option>
														</select>
													</div>
						
													<div class="feild horizontal-flex-container">
														<label>Priority</label>
														<select class="filler" name="priority">
															<option value="low"    ${routine_activity.activity.priority == "low"    ? "selected" : ""}>Low</option>
															<option value="medium" ${routine_activity.activity.priority == "medium" ? "selected" : ""}>Medium</option>
															<option value="high"   ${routine_activity.activity.priority == "high"   ? "selected" : ""}>High</option>
														</select>
													</div>
													<div class="feild horizontal-flex-container">
														<input type="submit" class="filler" value="Edit Routine" class="filler"/>
													</div>
											</div>
										</div>
									`;

									RoutineActivityEditor.querySelector("input[type='submit']").addEventListener(
										"click",
										(event) => {
											let activity = {activity:{},days:{}};
											activity.days["sun"] = RoutineActivityEditor.querySelector("input[name='sun']").checked;
											activity.days["mon"] = RoutineActivityEditor.querySelector("input[name='mon']").checked;
											activity.days["tue"] = RoutineActivityEditor.querySelector("input[name='tue']").checked;
											activity.days["wed"] = RoutineActivityEditor.querySelector("input[name='wed']").checked;
											activity.days["thu"] = RoutineActivityEditor.querySelector("input[name='thu']").checked;
											activity.days["fri"] = RoutineActivityEditor.querySelector("input[name='fri']").checked;
											activity.days["sat"] = RoutineActivityEditor.querySelector("input[name='sat']").checked;

											activity.activity["duration_minutes"] = parseInt(RoutineActivityEditor.querySelector("input[name='duration_minutes']").value);
											activity.activity["background_color"] =          RoutineActivityEditor.querySelector("select[name='background_color']").value;
											activity.activity["description"]      =          RoutineActivityEditor.querySelector("input[name='description']").value;
											activity.activity["done"]             =          false;
											activity.activity["group"]            =          RoutineActivityEditor.querySelector("input[name='group']").value;
											activity.activity["name"]             =          RoutineActivityEditor.querySelector("input[name='name']").value;
											activity.activity["priority"]         =          RoutineActivityEditor.querySelector("select[name='priority']").value;
											activity.activity["time"]             =       `${RoutineActivityEditor.querySelector("input[name='time_h']").value}:${RoutineActivityEditor.querySelector("input[name='time_m']").value}`;
		
											UpdateDataByProperty(`routine_activities.${routine_activity_key}`,activity)
										}
									);

									RoutineActivityEditor.querySelector(`#open-activity-creator`).addEventListener(
										"click",
										() => {
											let RoutineActivitiesCreatorFeildsContainer = RoutineActivityEditor.querySelector(`#routine-activities-creator-feilds-container`);
											let open_button = RoutineActivityEditor.querySelector("#open-activity-creator");

											if(RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows == "0fr"){
												RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows = "1fr";
												open_button.style.transform = "rotate(90deg)";
											} else {
												RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows = "0fr";
												open_button.style.transform = "rotate(0deg)";
											}
										}
									);
									RoutineActivitiesEditor.appendChild(RoutineActivityEditor);
								}
							);
							let AddActivityForm = document.getElementById("routine-activities-creator-feilds-container");
							let SubmitButton = AddActivityForm.querySelector("input[type='submit']");
							SubmitButton.addEventListener(
								"click",
								() => {
									let activity = {activity:{},days:{}};
									activity.days["sun"] = AddActivityForm.querySelector("input[name='sun']").checked;
									activity.days["mon"] = AddActivityForm.querySelector("input[name='mon']").checked;
									activity.days["tue"] = AddActivityForm.querySelector("input[name='tue']").checked;
									activity.days["wed"] = AddActivityForm.querySelector("input[name='wed']").checked;
									activity.days["thu"] = AddActivityForm.querySelector("input[name='thu']").checked;
									activity.days["fri"] = AddActivityForm.querySelector("input[name='fri']").checked;
									activity.days["sat"] = AddActivityForm.querySelector("input[name='sat']").checked;
					
									activity.activity["background_color"] = AddActivityForm.querySelector("select[name='background_color']").value;
									activity.activity["description"]      = AddActivityForm.querySelector("input[name='description']").value;
									activity.activity["done"]             = false;
									activity.activity["duration_minutes"] = parseInt(AddActivityForm.querySelector("input[name='duration_minutes']").value);
									activity.activity["group"]            = AddActivityForm.querySelector("input[name='group']").value;
									activity.activity["name"]             = AddActivityForm.querySelector("input[name='name']").value;
									activity.activity["priority"]         = AddActivityForm.querySelector("select[name='priority']").value;
									activity.activity["time"]             = `${AddActivityForm.querySelector("input[name='time_h']").value}:${AddActivityForm.querySelector("input[name='time_m']").value}`;

									function getRndInteger(min, max) {
										return Math.floor(Math.random() * (max - min)) + min;
									}

									UpdateDataByProperty(`routine_activities.id_R${getRndInteger(0,100000000000)}`,activity);
								}
							);
						}
					);
				}
			);
		}
	);
}

function InitializeUI(){
		
	let MinRangeElement       = document.getElementById("min-range");
	let MaxRangeElement       = document.getElementById("max-range");
	let DayTabsHoursIndecator = document.getElementById("day-tabs-hours-indecator");

	let HandleRangeScroll = (Element,event) => {
		let DayTabsParent = document.getElementById("day-tabs-container-parent");
		let Difference = (MaxRangeElement.value - MinRangeElement.value) / 100 ; // (75 - 25) / 100 = 1/2
		let NewScreenHeight = 100 / Difference; // 100 / 1/2 = 100 * 2 = 200
		let DayTabs = document.getElementById("day-tabs-container");
		DayTabs.style.height = NewScreenHeight + "%";
		DayTabsHoursIndecator.style.height =  NewScreenHeight + "%";
		DayTabsParent.scrollTop = DayTabs.clientHeight * (MinRangeElement.value / 100);
	}

	MinRangeElement.addEventListener(
		"input",
		HandleRangeScroll
	);
	
	MaxRangeElement.addEventListener(
		"input",
		HandleRangeScroll
	);

	let DayTabContainer = document.getElementById("day-tabs-container-parent");
	DayTabContainer.addEventListener(
		"scroll",
		() => {
			let DayTabsParent = document.getElementById("day-tabs-container-parent");
			let DayTabs = document.getElementById("day-tabs-container");
			let RangeDifference =  MinRangeElement.value ;
			MinRangeElement.value = (DayTabsParent.scrollTop / DayTabs.clientHeight) * 100;
			RangeDifference -= MinRangeElement.value;
			MaxRangeElement.value -= RangeDifference;
		}
	);

	let RoutineActivitiesCreatorFeildsContainer = document.getElementById("routine-activities-creator-feilds-container");


	document.getElementById("open-activity-creator-a").addEventListener(
		"click",
		(Element) => {
			if(RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows == "0fr"){
				RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows = "1fr";
				Element.target.style.transform = "rotate(45deg)";
			} else {
				RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows = "0fr";
				Element.target.style.transform = "rotate(0deg)";
			}
		}
	);

	let CurrentTimeLine = document.getElementById("current-time");

	setInterval(function () {
		CurrentTimeLine.style.top = `${(new Date()).getHours()/24*100}%`;
	}, 1000*60);

	CurrentTimeLine.style.top = `${(new Date()).getHours()/24*100}%`;
	
}

document.addEventListener('DOMContentLoaded',InitializeApp);

