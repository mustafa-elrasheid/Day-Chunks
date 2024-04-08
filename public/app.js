
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
		SignInButton.onclick  = () => Auth.signInWithRedirect(Provider);
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
							(resolve)=>{
								
								/*{
									"group": "Work",
									"done": true,
									"description": "Complete project proposal",
									"name": "Task 1",
									"time": "09:00",
									"duration_minutes": 90,
									"background_color": "#ffcc00",
									"priority": "High"
								}*/
								/*
								UserDocumentRefrence.update({"days.sun.activities":
								{
									id_0:{
										"group": "Work",
										"done": true,
										"description": "Complete project proposal",
										"name": "Task 1",
										"time": "09:00",
										"duration_minutes": 90,
										"background_color": "#ffcc00",
										"priority": "High"
									},
									id_1:{
										"group": "Work",
										"done": true,
										"description": "Complete project proposal",
										"name": "Task 1",
										"time": "13:00",
										"duration_minutes": 90,
										"background_color": "#ffcc00",
										"priority": "High"
									}
								}
								});//*/
								/*
								UserDocumentRefrence.update({routine_activities:{
									id_R0:{
										days:{sun:true,mon:true,tue:true,wed:true,thu:true,fri:true,sat:true},
										activity:{
											group: "Sleep",
											done: false,
											description: "Take Rest",
											name: "Sleep morning",
											time: "00:00",
											duration_minutes: 60*5,
											background_color: "#ffcc00",
											priority: "low"
										}
									}
								}});//*/

								if(DocumentMetaData.exists) return resolve(DocumentMetaData.data());
								UserDocumentRefrence.set(
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
												ActivityElement.style.top = (FormatTimeToMinutes(activity.time)/1440)*100+"%";
												ActivityElement.style.height = (activity.duration_minutes/1440)*100+"%";
												if(activity.done){
													ActivityElement.style.color = "var(--dark-sliver-color)"
													ActivityElement.style.borderColor = "var(--light-gray-color)";
												}
												{
													let ActivityElementTitleMenu = document.createElement("div");
													ActivityElementTitleMenu.setAttribute("class","horizontal-flex-container");

													{
														let InfoSpan = document.createElement("span");
														InfoSpan.innerHTML = `
															<span>
																<b>${activity.name}</b>
																<span>from ${activity.group}</span>
																<span>
																at ${activity.time}
																for ${activity.duration_minutes} minutes
															</span>
															</span>
														`;
														ActivityElementTitleMenu.appendChild(InfoSpan);
													}
													{
														let Filler = document.createElement("div");
														Filler.setAttribute("class","filler");
														ActivityElementTitleMenu.appendChild(Filler);
													}
													{
														let FinishingButton = document.createElement("button");
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
														FinishingButton.setAttribute("id",`days-${day_key}-activities-${activity_key}-done`);
														ActivityElementTitleMenu.appendChild(FinishingButton);
													}
													ActivityElement.appendChild(ActivityElementTitleMenu);
													
												}
												{
													let Description = document.createElement("div");
													Description.innerHTML = `
														<span>
															Description: ${activity.description}
														</span>
													`;
													ActivityElement.appendChild(Description);
												}
												DayTab.appendChild(ActivityElement);
											}
										}
									);
								}
							);
							Object.keys(Data.routine_activities).forEach(
								(routine_activity_key/* also the id */) => {
									let routine_activity = Data.routine_activities[routine_activity_key];
									Object.keys(Data.days).forEach(
										(day_key) => {
											let DayData = Data.days[day_key]; /* list of activities */
											if(routine_activity.days[day_key] === true){
												let IsFound = false;
												Object.keys(DayData.activities).forEach(
													(checked_activity_key) => {
														if(DayData.activities[checked_activity_key]){
															IsFound = true;
														}
													}
												);
												if(!IsFound){
													let property = `days.${day_key}.activities.${routine_activity_key}`;
													let UpdatedData = {};
													UpdatedData[property] = routine_activity.activity;
													UserDocumentRefrence.update(UpdatedData);
												}
											}
										}
									);
									let RoutineActivitiesEditor = document.getElementById("routine-activities-editor");
									RoutineActivitiesEditor.innerHTML = "";

									let RoutineActivityEditor = document.createElement("div");
									RoutineActivityEditor.setAttribute("class","routine-activity-editor");
									RoutineActivityEditor.innerHTML = `
										${routine_activity}
									`;
									RoutineActivitiesEditor.appendChild(RoutineActivityEditor);
									console.log("hi");
								}
							)
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

}

document.addEventListener('DOMContentLoaded',Initialize);
