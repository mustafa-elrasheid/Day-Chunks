/*
 * WARNING: This is copyrighted content.
 *
 * Owner: Mustafa El-rasheid
 * All rights reserved.
 */

function FormatHours(hours,minutes){
	if(hours == 0)  return `12:00am`;
	if(hours == 12) return `12:00pm`;
	if(hours == 24) return `11:59pm`;
	if(hours > 12)  return `${hours-12}:${minutes}pm`;
	else            return `${hours}:${minutes}am`;
}

function FormatDuration(minutes){
	return `${minutes / 60 != 0 ? `${minutes / 60}h` : ``} ${minutes % 60 != 0 && minutes / 60 != 0 ? ` and ` : ``} ${minutes % 60 != 0 ? `${ minutes % 60}m` : ``}`;
}

let unsubscribe;

function InitializeApp(){

	InitializeUI();

	let App;
	let Auth;
	let DataBase;
	let GoogleProvider;
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
	let MainSectionSignIn                = document.getElementById("main-signed-in");
	let MainSectionSignOut               = document.getElementById("main-signed-out");
	let MainLoading                      = document.getElementById("main-loading");
     
	let SignInGoogleButton               = document.getElementById("sign-in-google-button");
		SignInGoogleButton.onclick       = () => Auth.signInWithPopup(GoogleProvider);
	let SignInAnonymouslyButton          = document.getElementById("sign-in-anonymously-button");
		SignInAnonymouslyButton.onclick  = () => Auth.signInAnonymously();
	let SignOutButton                    = document.getElementById("sign-out-button");
		SignOutButton.onclick            = () => Auth.signOut();
	let SignInEmailButton                = document.getElementById("sign-in-email").querySelector("input[type='submit']");
		SignInEmailButton.onclick        = () => {
			let email = document.getElementById("sign-in-email").querySelector("input[type='email']").value;
			let password = document.getElementById("sign-in-email").querySelector("input[type='password']").value;
			let error_dialog = document.getElementById("sign-in-email").querySelector("#error-dialog");

			Auth.signInWithEmailAndPassword(email,password)
			.then(()=>{})
			.catch((e)=>{error_dialog.innerHTML = "Wrong username or password";console.log(e)} );
		}

	let CreateAccountEmailButton                = document.getElementById("create-account-email").querySelector("input[type='submit']");
	    CreateAccountEmailButton.onclick        = () => {
			let email = document.getElementById("create-account-email").querySelector("input[type='email']").value;
			let password = document.getElementById("create-account-email").querySelector("input[type='password']").value;
			let confirmed_password = document.getElementById("create-account-email").querySelector("#confirm-password").value;
			let error_dialog = document.getElementById("create-account-email").querySelector("#error-dialog");

			if(/\w+@\w+\.\w+/.test(email) == false){
				error_dialog.innerHTML = "wrong format";
				return;
			}
			if(password != confirmed_password){
				error_dialog.innerHTML = "Passwords don't match, Please Confirm your password";
				return;
			}
			
			Auth.createUserWithEmailAndPassword(email,password)
			.then(()=>{})
			.catch((e)=>{error_dialog.innerHTML = "account is already in use";console.log(e)} );
		};
	
	
	let DeleteAccountButton = document.getElementById("delete-account-button");


	let SettingsMenu = document.getElementById("settings");

	let sign_in_releated_elements = [SettingsMenu,MainSectionSignIn];
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
			function NearestWeekEndDay(date,weekend_day){
				for(;date.getDay() != weekend_day;date.setDate(date.getDate()+1));
				return date;
			}

			DeleteAccountButton.onclick = () => {
				if(confirm("Are you sure you want to delete your account?")){
					DataBase.collection("users").doc(user.uid).delete();
					user.delete();
				}
			};

			if (!user) {
				TurnHiddenPropery(sign_out_releated_elements,false);
				TurnHiddenPropery(sign_in_releated_elements,true);
				TurnHiddenPropery(loading_related_elements,true);
				if (unsubscribe) unsubscribe();
				return;
			}
		
			TurnHiddenPropery(sign_out_releated_elements,true);
			TurnHiddenPropery(sign_in_releated_elements,false);
			TurnHiddenPropery(loading_related_elements,true);

			let UserDocumentRefrence = DataBase.collection("users").doc(user.uid);

			// fetch user's data, if found nothing, it will create a template
			unsubscribe = UserDocumentRefrence.onSnapshot(
				(_DocumentMetaData)=>{

					let UpdateUserDocByProperty = (property,data) => {
						let UpdatedData = {};
						UpdatedData[property] = data;
						UserDocumentRefrence.update(UpdatedData);
					}

					const DefualtActivities = {
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
								if(DocumentMetaData.exists) {
									return resolve(DocumentMetaData.data());
								} else { 
									let DefaultUserData = {
										week_end_day:NearestWeekEndDay(new Date(),WeekEndDay),
										days:DefualtActivities,
										routine_activities:{}
									};
									UserDocumentRefrence.set(DefaultUserData);
									return resolve(DefaultUserData);
								}
							}
						);
					};

					FetchData(_DocumentMetaData).then(
						(Data)=>{



							// reseting weekly data
							let IsWeekOver = new Date().setHours(0,0,0,0) > new Date(Data.week_end_day.seconds * 1000).setHours(0,0,0,0);
							if(IsWeekOver){
								UpdateUserDocByProperty("week_end_day",NearestWeekEndDay(new Date(),WeekEndDay));
								UpdateUserDocByProperty("days",DefualtActivities);
							}


							
							// handles dinamic UI elements in schedule section
							Object.keys(Data.days).forEach(
								(DayKey) => {
									let Day = Data.days[DayKey];
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
												if(! (Data.routine_activities[ActivityKey]) ){
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


							let SortedRoutineActivities = Object.keys(Data.routine_activities).sort(
								(key1, key2) => {
									let routine_activity1 = Data.routine_activities[key1];
									let routine_activity2 = Data.routine_activities[key2];
									if(routine_activity1.activity.group.localeCompare(routine_activity2.activity.group) != 0){
										return routine_activity1.activity.group.localeCompare(routine_activity2.activity.group);
									} else {
										return routine_activity1.activity.name.localeCompare(routine_activity2.activity.name);
									}
								}
							);

							

							let CreateActivityEditor = (Activity,Days,UpdateEvent,TopMessage,SubmitButtonMessage,IconPath,OpenRotationDegree,DeleteAction = false,lockdays = false) => {

								let ActivityEditor = document.createElement("div");
								ActivityEditor.setAttribute("class","activity-editor");
								ActivityEditor.style.backgroundColor = Activity.background_color;
							
								if(Activity.priority == "low") ActivityEditor.style.borderColor = "white";
								if(Activity.priority == "medium" ) ActivityEditor.style.borderColor = "yellow";
								if(Activity.priority == "high" ) ActivityEditor.style.borderColor = "red";
							
								ActivityEditor.innerHTML = `		
									<div class="feild horizontal-flex-container">
										<button id="open-activity-creator">
											<img src="${IconPath}" />
										</button>
										${TopMessage ?
											`<h2 style="display:inline;">${TopMessage}</h2>`
											: `<div><h2 style="display:inline;">${Activity.name}</h2><span> from ${Activity.group}</span></div>`}
										
									</div>
									<div id="routine-activities-creator-feilds-container" style="grid-template-rows: 0fr;">
										<div>

											<div class="feild">
												${
													lockdays ?
													`this activity is locked at ${Object.keys(Days)[0]} this week only` :
													`<div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;">
														<div style="text-align: center;" > <b> Sun </b><br/> <input ${Days.sun ? "checked" : ""} type="checkbox" name="sun" id="sun"/> </div>
														<div style="text-align: center;" > <b> Mon </b><br/> <input ${Days.mon ? "checked" : ""} type="checkbox" name="mon" id="mon"/> </div>
														<div style="text-align: center;" > <b> Tue </b><br/> <input ${Days.tue ? "checked" : ""} type="checkbox" name="tue" id="tue"/> </div>
														<div style="text-align: center;" > <b> Wed </b><br/> <input ${Days.wed ? "checked" : ""} type="checkbox" name="wed" id="wed"/> </div>
														<div style="text-align: center;" > <b> Thu </b><br/> <input ${Days.thu ? "checked" : ""} type="checkbox" name="thu" id="thu"/> </div>
														<div style="text-align: center;" > <b> Fri </b><br/> <input ${Days.fri ? "checked" : ""} type="checkbox" name="fri" id="fri"/> </div>
														<div style="text-align: center;" > <b> Sat </b><br/> <input ${Days.sat ? "checked" : ""} type="checkbox" name="sat" id="sat"/> </div>
													</div>`
												}
											</div>
											<div class="feild horizontal-flex-container">
												<label>Name</label>
												<input placeholder="Title" class="filler" type="text" name="name" value="${Activity.name}">
											</div>
											<div class="feild horizontal-flex-container">
												<label>Time</label>
												<input class="filler" name="time" type="time" value="${Activity.time}" >
											</div>
											<div class="feild horizontal-flex-container">
												<label>Duration</label>
												<input placeholder="in minutes" class="filler" type="number" name="duration_minutes" value="${Activity.duration_minutes}" >
											</div>
											<div class="feild horizontal-flex-container">
												<label>Group</label>
												<input placeholder="Related for" class="filler" type="text" name="group" value="${Activity.group}">
											</div>
											
											<div class="feild horizontal-flex-container">
												<label>Description</label>
												<input placeholder="More details" class="filler" type="text" name="description"  value="${Activity.description}">
											</div>
											<div class="feild horizontal-flex-container">
												<label>Color</label>
												<select class="filler" name="background_color">
													<option value ="#46474Dff" style="background-color: #46474Dff;" ${Activity.background_color == "#46474Dff" ? "selected" : ""}>Gray</option>
													<option value ="#4d2c2cff" style="background-color: #4d2c2cff;" ${Activity.background_color == "#4d2c2cff" ? "selected" : ""}>Red</option>
													<option value ="#4d392cff" style="background-color: #4d392cff;" ${Activity.background_color == "#4d392cff" ? "selected" : ""}>Orange</option>
													<option value ="#4d452cff" style="background-color: #4d452cff;" ${Activity.background_color == "#4d452cff" ? "selected" : ""}>Yellow</option>
													<option value ="#2d4d3eff" style="background-color: #2d4d3eff;" ${Activity.background_color == "#2d4d3eff" ? "selected" : ""}>Green</option>
													<option value ="#324146ff" style="background-color: #324146ff;" ${Activity.background_color == "#324146ff" ? "selected" : ""}>Cyan</option>
													<option value ="#36354dff" style="background-color: #36354dff;" ${Activity.background_color == "#36354dff" ? "selected" : ""}>Blue</option>
													<option value ="#42313dff" style="background-color: #42313dff;" ${Activity.background_color == "#42313dff" ? "selected" : ""}>Purple</option>
												</select>
											</div>
						
											<div class="feild horizontal-flex-container">
												<label>Priority</label>
												<select class="filler" name="priority">
													<option value="low"    ${Activity.priority == "low"    ? "selected" : ""}>Low</option>
													<option value="medium" ${Activity.priority == "medium" ? "selected" : ""}>Medium</option>
													<option value="high"   ${Activity.priority == "high"   ? "selected" : ""}>High</option>
												</select>
											</div>
											<div class="feild horizontal-flex-container">
												<input type="submit" class="filler" value="${SubmitButtonMessage}" class="filler"/>
												${DeleteAction ?
													`<input type="button" name="delete" value="Delete" class="filler"/>` 
													: ``
												}
											</div>
										</div>
									</div>
								`;
							
								ActivityEditor.querySelector("input[type='submit']").onclick = (event) => {
									let activity ={};
									let days = {};
									
									if(!lockdays){
										days["sun"] = ActivityEditor.querySelector("input[name='sun']").checked;
										days["mon"] = ActivityEditor.querySelector("input[name='mon']").checked;
										days["tue"] = ActivityEditor.querySelector("input[name='tue']").checked;
										days["wed"] = ActivityEditor.querySelector("input[name='wed']").checked;
										days["thu"] = ActivityEditor.querySelector("input[name='thu']").checked;
										days["fri"] = ActivityEditor.querySelector("input[name='fri']").checked;
										days["sat"] = ActivityEditor.querySelector("input[name='sat']").checked;
									}

						
									activity["duration_minutes"] = parseInt(ActivityEditor.querySelector("input[name='duration_minutes']").value);
									activity["background_color"] =          ActivityEditor.querySelector("select[name='background_color']").value;
									activity["description"]      =          ActivityEditor.querySelector("input[name='description']").value;
									activity["done"]             =          false;
									activity["group"]            =          ActivityEditor.querySelector("input[name='group']").value;
									activity["name"]             =          ActivityEditor.querySelector("input[name='name']").value;
									activity["priority"]         =          ActivityEditor.querySelector("select[name='priority']").value;
									activity["time"]             =          ActivityEditor.querySelector("input[name='time']").value;
						
									UpdateEvent(activity,days);
								};

								if(DeleteAction){
									ActivityEditor.querySelector("input[name='delete']").onclick = (event) => {
										DeleteAction();
									};
								} 
								ActivityEditor.querySelector(`#open-activity-creator`).onclick = () => {
									let RoutineActivitiesCreatorFeildsContainer = ActivityEditor.querySelector(`#routine-activities-creator-feilds-container`);
									let open_button = ActivityEditor.querySelector("#open-activity-creator");
							
									if(RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows == "0fr"){
										RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows = "1fr";
										open_button.style.transform = `rotate(${OpenRotationDegree}deg)`;
									} else {
										RoutineActivitiesCreatorFeildsContainer.style.gridTemplateRows = "0fr";
										open_button.style.transform = `rotate(0deg)`;
									}
								}

								return ActivityEditor;
							}

							let RoutineActivitiesEditor = document.getElementById("routine-activities-editor");
							RoutineActivitiesEditor.innerHTML = "";
							RoutineActivitiesEditor.appendChild(
								CreateActivityEditor({time:"00:00",duration_minutes:"",name:"",description:"",group:""},{},
									(activity,days) => {
										function getRndInteger(min, max) {
											return Math.floor(Math.random() * (max - min)) + min;
										}
										UpdateUserDocByProperty(`routine_activities.id_${getRndInteger(0,100000000000)}`,{activity,days});
									},
									"Add Routine",
									"Add Routine",
									"/icons/plus.svg",
									45
								)
							);

							SortedRoutineActivities.forEach(
								(routine_ActivityKey/* also the id */) => {
									let routine_activity = Data.routine_activities[routine_ActivityKey];
									
									RoutineActivitiesEditor.appendChild(
										CreateActivityEditor(routine_activity.activity,routine_activity.days,
											(activity,days) => {
												UpdateUserDocByProperty(`routine_activities.${routine_ActivityKey}`,{activity,days});
											},
											false,
											"Edit Routine",
											"/icons/arrow.svg",
											90,
											() => {
												delete Data.routine_activities[routine_ActivityKey];
											
												UpdateUserDocByProperty(`routine_activities`,Data.routine_activities);

												Object.keys(Data.days).forEach(
													(DayKey) => {
														let Day = Data.days[DayKey];
			
														if(Day.activities[routine_ActivityKey] && !Day.activities[routine_ActivityKey].done){
			
															delete Day.activities[routine_ActivityKey];
														
															UpdateUserDocByProperty(`days.${DayKey}`,Day);
															return;
														}
													}
												);
											}
										)
									);
								}
							);

							let OneTimeActivitiesEditor = document.getElementById("one-time-activities-editor");
							OneTimeActivitiesEditor.innerHTML = "";
							OneTimeActivitiesEditor.appendChild(
								CreateActivityEditor({time:"00:00",duration_minutes:"",name:"",description:"",group:""},{},
									(activity,days) => {
										
										function getRndInteger(min, max) {
											return Math.floor(Math.random() * (max - min)) + min;
										}
										let random_number = getRndInteger(0,100000000000);
										Object.keys(days).forEach(
											(DayKey) => {
												if(days[DayKey]){
													UpdateUserDocByProperty(`days.${DayKey}.activities.id_R${random_number}`,activity);	
												}
											}
										)
									},
									"Add One-time Activity",
									"Add One-time Activity",
									"/icons/plus.svg",
									45
								)
							);

							Object.keys(Data.days).forEach(
								(DayKey) => {
									let Day = Data.days[DayKey];
									Object.keys(Day.activities).forEach(
										(ActivityKey) => {
											let activity = Day.activities[ActivityKey];
											if(!(Data.routine_activities[ActivityKey])){
												let property = `${DayKey}`;
												let days = {};
												days[property] = true;
												OneTimeActivitiesEditor.appendChild(
													CreateActivityEditor(activity,days,
														(activity,days) => {
															UpdateUserDocByProperty(`days.${DayKey}.activities.${ActivityKey}`,activity);	
														},
														false,
														"Edit Routine",
														"/icons/arrow.svg",
														90,
														() => {
															delete Day.activities[ActivityKey];
															UpdateUserDocByProperty(`days.${DayKey}`,Day);
														},
														true
													)
												);
											}
										}
									);
								}
							);

							let ThisWeekStatusElement = document.getElementById("this-week-status");
							ThisWeekStatusElement.innerHTML = "<h2>This Week's Progress</h2>";

							SortedRoutineActivities.forEach(
								(routine_ActivityKey/* also the id */) => {
									let routine_activity = Data.routine_activities[routine_ActivityKey];

									let ActivityStatusElement = document.createElement("div");
									ActivityStatusElement.setAttribute("class","routine-checkup");
									ActivityStatusElement.style.backgroundColor = routine_activity.activity.background_color;
									ActivityStatusElement.innerHTML += `
										<div>
											<h3>${routine_activity.activity.name} from ${routine_activity.activity.group}</h3>
										</div>
										<div class="horizontal-flex-container checks-container">
										</div>
									`;

									["sun","mon","tue","wed","thu","fri","sat"].forEach(
										(DayKey,index) => {
											if(routine_activity.days[DayKey]){
												let ChecksContainer = ActivityStatusElement.querySelector(".checks-container")
												let Check = document.createElement("div");
												Check.setAttribute("class","check filler");
												if(index <= (new Date()).getDay() && Data.days[DayKey].activities[routine_ActivityKey]){
													if(Data.days[DayKey].activities[routine_ActivityKey].done == "finish" || Data.days[DayKey].activities[routine_ActivityKey].done === true) Check.style.background = "limegreen";
													if(Data.days[DayKey].activities[routine_ActivityKey].done == "cancel") Check.style.background = "var(--dark-gray-color)";
													if(!Data.days[DayKey].activities[routine_ActivityKey].done) Check.style.background = "red";
												} else{
													Check.style.background = "var(--dark-gray-color)";
												}
												ChecksContainer.appendChild(Check);
											}
										}
									);
									ThisWeekStatusElement.appendChild(ActivityStatusElement);
								}
							);

							// handles generating activities based on rountines in plan
							Object.keys(Data.days).forEach(
								(DayKey) => {
									let Day = Data.days[DayKey];

									Object.keys(Data.routine_activities).forEach(
										(routine_ActivityKey/* also the id */) => {

											let routine_activity = Data.routine_activities[routine_ActivityKey];

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
					);
				}
			);
		}
	);
}

function InitializeUI(){

	let letmedosomething = document.getElementById("day-tabs-container-overflowing");
	let DayTabsParent = document.getElementById("day-tabs-container-parent");

	let ZoomRange = document.getElementById("zoom");

	ZoomRange.oninput = 
		() => {
			letmedosomething.style.height =  `${ZoomRange.value}%`;
		};
	

	let CurrentTimeLine = document.getElementById("current-time");

	setInterval(function () {
		CurrentTimeLine.style.top = `${(( (new Date()).getHours() * 60) + (new Date().getMinutes())) / (60*24) * 100}%`;
	}, 1000*60);

	CurrentTimeLine.style.top = `${(( (new Date()).getHours() * 60) + (new Date().getMinutes()) )/ (60*24) * 100}%`;
}

document.addEventListener('DOMContentLoaded',InitializeApp);

