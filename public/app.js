

let unsubscribe;

console.log("app.js was loaded succesfully");

function NearestWeekEndDay(date,weekend_day){
	for(;date.getDay() != weekend_day;date.setDate(date.getDate()+1)){

	}
	return date;
}

function TurnHiddenPropery(elements,value) {
	elements.forEach(element => {
		element.hidden = value;
	});
}

let DefualtActivities = {
	sun:{activities:{}},
	mon:{activities:{}},
	tue:{activities:{}},
	wed:{activities:{}},
	thu:{activities:{}},
	fri:{activities:{}},
	sat:{activities:{}}
};

function formatTime(hours_and_minutes) {
	const [hours, minutes] = hours_and_minutes.split(':').map(Number);
	return (hours * 60) + minutes;
}

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
	let nav                   = document.getElementsByTagName("nav")[0];
	let MainSectionSignIn     = document.getElementById("main-signed-in");
	let MainSectionSignOut    = document.getElementById("main-signed-out");

	let sign_in_releated_elements = [SignOutButton,nav,MainSectionSignIn];
	let sign_out_releated_elements = [SignInButton,MainSectionSignOut];

	window.addEventListener('beforeunload', () => {if(unsubscribe) unsubscribe();});
	Auth.onAuthStateChanged(
		user => {
			if (!user) {
				TurnHiddenPropery(sign_out_releated_elements,false)
				TurnHiddenPropery(sign_in_releated_elements,true);
				if (unsubscribe) unsubscribe();
				return;
			}
		
			TurnHiddenPropery(sign_out_releated_elements,true)
			TurnHiddenPropery(sign_in_releated_elements,false);

			let UserDocumentRefrence = DataBase.collection("users").doc(user.uid);

			// fetch user's data, if found nothing, it will create a template
			unsubscribe = UserDocumentRefrence.onSnapshot(
				(_DocumentMetaData)=>{
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
								if(DocumentMetaData.exists) return resolve(DocumentMetaData.data());
								UserDocumentRefrence.set({week_end_day:NearestWeekEndDay(new Date(),WeekEndDay),days:DefualtActivities});

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
											let DayTab = document.getElementById(`${day_key}-tab`);
											let activity = DayData.activities[activity_key];
											{
												let ActivityElement = document.createElement("div");
												ActivityElement.setAttribute("class","activity");
												ActivityElement.setAttribute("id",`days-${day_key}-activities-${activity_key}`);
												ActivityElement.style.top = (formatTime(activity.time)/1440)*100+"%";
												ActivityElement.style.height = (activity.duration_minutes/1440)*100+"%";
												if(activity.done){
													ActivityElement.style.color = "var(--dark-sliver-color)"
													ActivityElement.style.borderColor = "var(--light-gray-color)";
												}
												{
													let ActivityElementTitleMenu = document.createElement("div");
													ActivityElementTitleMenu.setAttribute("class","menu-container");

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


	let DayTabContainer = document.getElementById("day-tabs-container");
	DayTabContainer.addEventListener(
		"scroll",
		()=>{
			alert(1);
		}
	);

}

document.addEventListener('DOMContentLoaded',Initialize);
