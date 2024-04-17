
let unsubscribe;

console.log("app.js was loaded succesfully");






function Initialize(){

	let App;
	let Auth;
	let DataBase;
	let Provider;
	// firebase SDK
	try {
		App = firebase.app();
		Auth = firebase.auth();
		DataBase = firebase.firestore();
		Provider = new firebase.auth.GoogleAuthProvider();
	} catch (error) {
		console.log("failed to load SDK");
		console.error(error);
	}


	let WeekEndDay = 6;

	// grabing elements to add functality to theme
	let SignInButton          = document.getElementById("sign-in-button");
		SignInButton.onclick  = () => Auth.signInWithPopup(Provider);
	let SignOutButton         = document.getElementById("sign-out-button");
		SignOutButton.onclick = () => Auth.signOut();
	let nav                   = document.getElementById("main-nav-bar");
	let MainSectionSignIn     = document.getElementById("main-signed-in");
	let MainSectionSignOut    = document.getElementById("main-signed-out");
	let MainLoading           = document.getElementById("main-loading");

	let sign_in_releated_elements = [SignOutButton,nav,MainSectionSignIn];
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
							Object.keys(Data.days).forEach(
								(day_key) => {
									let DayData = Data.days[day_key];
									document.getElementById(`${day_key}-tab`).innerHTML = "";
									Object.keys(DayData.activities).forEach(
										(activity_key) => {
											function FormatTimeToMinutes(hours_and_minutes) {
												const [hours, minutes] = hours_and_minutes.split(':').map(Number);
												return (hours * 60) + minutes;
											}
											let DayTab = document.getElementById(`${day_key}-tab`);
											let activity = DayData.activities[activity_key];
											{
												let ActivityElement = document.createElement("div");
												ActivityElement.setAttribute("class","activity");
												ActivityElement.setAttribute("id",`days-${day_key}-activities-${activity_key}`);
												ActivityElement.style.top = `calc(${(FormatTimeToMinutes(activity.time)/1440)*100}% + 0.1em)`;
												ActivityElement.style.height = `calc(${(activity.duration_minutes/1440)*100}% - 0.2em)`;
												if(activity.done){
													ActivityElement.style.color = "var(--dark-sliver-color)"
													ActivityElement.style.borderColor = "var(--light-gray-color)";
												}

												ActivityElement.innerHTML = `
													<div class="horizontal-flex-container">
														<span>
															<b>${activity.name}</b>
															<span>from ${activity.group}</span>
														</span>
														<div class="filler"></div>
														<button id="days-${day_key}-activities-${activity_key}-done"></button>
													</div>
													<span>
														at ${activity.time}
														for ${activity.duration_minutes} minutes
													</span>
													<span>
														Description: ${activity.description}
													</span>
												`;
											
											
												let FinishingButton = ActivityElement.querySelector(`#days-${day_key}-activities-${activity_key}-done`);
												FinishingButton.addEventListener(
													"click",
													(Element)=>{
														let IsDone = Element.target.innerHTML == "Finish" ? true : false;
														let property = Element.target.getAttribute("id").replace(/-/g, '.');
														let UpdatedData = {};
														UpdatedData[property] = IsDone;
														UserDocumentRefrence.update(UpdatedData);
													}
												);
												FinishingButton.innerHTML = !activity.done ? "Finish" : "Undo";
												
												DayTab.appendChild(ActivityElement);
											}
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
													let property = `days.${day_key}.activities.${routine_activity_key}`;
													let UpdatedData = {};
													UpdatedData[property] = routine_activity.activity;
													UserDocumentRefrence.update(UpdatedData);
												};

												if(!DayData.activities[routine_activity_key]){
													EditRoutine();
													return;
												}


												let checked_activity = DayData.activities[routine_activity_key];

												if(checked_activity.done) return;

												if(
													checked_activity.background_color != routine_activity.activity.background_color ||
													checked_activity.description      != routine_activity.activity.description ||
													checked_activity.duration_minutes != routine_activity.activity.duration_minutes ||
													checked_activity.group            != routine_activity.activity.group ||
													checked_activity.name             != routine_activity.activity.name ||
													checked_activity.priority         != routine_activity.activity.priority ||
													checked_activity.time             != routine_activity.activity.time 
												)EditRoutine();
											}
										}
									);

									let RoutineActivityEditor = document.createElement("div");
									RoutineActivityEditor.setAttribute("class","routine-activity-editor");
									RoutineActivityEditor.innerHTML = `
																				
										<div class="feild horizontal-flex-container">
											<div>
												<h2>Edit Routine: ${routine_activity.activity.name} from ${routine_activity.activity.group}</h2>
												<span>here you can edit routine activites and they will be changed to your liking automaticly!</span>
											</div>
											<div class="filler"></div>
											<button id="open-activity-creator" class="routine_activities.${routine_activity_key}">+</button>
										</div>
										<div id="routine_activities.${routine_activity_key}.feilds-container" hidden="true">
											<div class="feild">
												<label >Sun</label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.days.sun" ${routine_activity.days.sun ? "checked" : ""}>
												<label >Mon</label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.days.mon" ${routine_activity.days.mon ? "checked" : ""}>
												<label >Tue</label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.days.tue" ${routine_activity.days.tue ? "checked" : ""}>
												<label >Wed</label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.days.wed" ${routine_activity.days.wed ? "checked" : ""}>
												<label >Thu</label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.days.thu" ${routine_activity.days.thu ? "checked" : ""}>
												<label >Fri</label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.days.fri" ${routine_activity.days.fri ? "checked" : ""}>
												<label >Sat</label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.days.sat" ${routine_activity.days.sat ? "checked" : ""}>
											</div>
											<div class="feild horizontal-flex-container">
												<label class="centering-parent"> Group </label>
												<input class="filler" type="text" id="routine_activities.${routine_activity_key}.activity.group" value="${routine_activity.activity.group}">
											</div>
											
											<div class="feild horizontal-flex-container">
												<label class="centering-parent"> Done </label>
												<input type="checkbox" id="routine_activities.${routine_activity_key}.activity.done" value="${routine_activity.activity.done}">
												<div class="filler" ></div>
											</div>
											
											<div class="feild horizontal-flex-container">
												<label class="centering-parent" >Description</label>
												<input class="filler" type="text" id="routine_activities.${routine_activity_key}.activity.description" value="${routine_activity.activity.description}">
											</div>description
											
											<div class="feild horizontal-flex-container">
												<label class="centering-parent" >Name</label>
												<input class="filler" type="text" id="routine_activities.${routine_activity_key}.activity.name" value="${routine_activity.activity.name}">
											</div>
											
											<div class="feild horizontal-flex-container">
												<label class="centering-parent" >Time</label>
												<input class="filler" type="text" id="routine_activities.${routine_activity_key}.activity.time" value="${routine_activity.activity.time}">
											</div>
											<div class="feild horizontal-flex-container">
												<label class="centering-parent" >Duration (minutes)</label>
												<input class="filler" type="number" id="routine_activities.${routine_activity_key}.activity.duration_minutes" value="${routine_activity.activity.duration_minutes}">
											</div>
											
											<div class="feild horizontal-flex-container">
												<label class="centering-parent" >Background Color</label>
												<input class="filler" type="color" id="routine_activities.${routine_activity_key}.activity.background_color" value="${routine_activity.activity.background_color}">
											</div>

											<div class="feild horizontal-flex-container">
												<label class="centering-parent"  for="activity-priority">Priority</label>
												<select id="routine_activities.${routine_activity_key}.activity.priority">
													<option value="low" ${routine_activity.activity.priority == "low" ? "selected" : ""}>Low</option>
													<option value="medium" ${routine_activity.activity.priority == "medium" ? "selected" : ""}>Medium</option>
													<option value="high" ${routine_activity.activity.priority == "high" ? "selected" : ""}>High</option>
												</select>
											</div>
										</div>
										
									`;

									RoutineActivityEditor.querySelectorAll("input").forEach(
										(Element) => {
											Element.addEventListener(
												"blur",
												(event) => {
													let property = event.target.getAttribute("id");
													let UpdatedData = {};
	
													if (event.target.type === 'checkbox') UpdatedData[property] = event.target.checked;
													else UpdatedData[property] = event.target.value;
													
													UserDocumentRefrence.update(UpdatedData);
												}
											);
										}
									);
									RoutineActivityEditor.querySelector(`#open-activity-creator`).addEventListener(
										"click",
										(Element) => {
											let RoutineActivitiesCreatorFeildsContainer = document.getElementById(`${Element.target.getAttribute("class")}.feilds-container`);
											RoutineActivitiesCreatorFeildsContainer.hidden = !RoutineActivitiesCreatorFeildsContainer.hidden;
											Element.target.innerHTML = Element.target.innerHTML == "+" ? "x" : "+" ;
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
					
									activity.activity["background_color"] = AddActivityForm.querySelector("input[name='background_color']").value;
									activity.activity["description"]      = AddActivityForm.querySelector("input[name='description']").value;
									activity.activity["done"]             = AddActivityForm.querySelector("input[name='done']").checked;
									activity.activity["duration_minutes"] = parseInt(AddActivityForm.querySelector("input[name='duration_minutes']").value);
									activity.activity["group"]            = AddActivityForm.querySelector("input[name='group']").value;
									activity.activity["name"]             = AddActivityForm.querySelector("input[name='name']").value;
									activity.activity["priority"]         = AddActivityForm.querySelector("select[name='priority']").value;
									activity.activity["time"]             = AddActivityForm.querySelector("input[name='time']").value;
									console.log(activity);

									function getRndInteger(min, max) {
										return Math.floor(Math.random() * (max - min)) + min;
									}

									let property = `routine_activities.id_R${getRndInteger(0,100000000000)}`;
									let UpdatedData = {};
									UpdatedData[property] = activity;
									UserDocumentRefrence.update(UpdatedData);
								}
							);
						}
					);
				}
			);
		}
	);
	
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

	document.getElementById("open-activity-creator").addEventListener(
		"click",
		(Element) => {
			let RoutineActivitiesCreatorFeildsContainer = document.getElementById("routine-activities-creator-feilds-container");
			RoutineActivitiesCreatorFeildsContainer.hidden = !RoutineActivitiesCreatorFeildsContainer.hidden;
			Element.target.innerHTML = Element.target.innerHTML == "+" ? "x" : "+" ;
		}
	);

	//routine-activities-editor

}

document.addEventListener('DOMContentLoaded',Initialize);
