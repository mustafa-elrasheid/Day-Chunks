/*
 * WARNING: This is copyrighted content.
 *
 * Owner: Mustafa El-rasheid
 * All rights reserved.
 */

let unsubscribe;

function InitializeLoginUI (Auth,{GoogleProvider}) {
	document.getElementById("sign-in-google-button").onclick                               = () => Auth.signInWithPopup(GoogleProvider);
	document.getElementById("sign-in-anonymously-button").onclick                          = () => Auth.signInAnonymously();
	document.getElementById("sign-out-button").onclick                                     = () => Auth.signOut();
	document.getElementById("sign-in-email").querySelector("input[type='submit']").onclick = () => {
		let email = document.getElementById("sign-in-email").querySelector("input[type='email']").value;
		let password = document.getElementById("sign-in-email").querySelector("input[type='password']").value;
		let error_dialog = document.getElementById("sign-in-email").querySelector("#error-dialog");

		Auth.signInWithEmailAndPassword(email,password)
		.then(()=>{})
		.catch((e)=>{error_dialog.innerHTML = "Wrong username or password";console.log(e)} );
	}
	document.getElementById("create-account-email").querySelector("input[type='submit']").onclick        = () => {
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
}

function InitializeApp(){
	
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

	InitializeLoginUI(Auth,{GoogleProvider:GoogleProvider});
	InitializeScheduleZoom();
	InitializeTimeMarker();

	let WeekEndDay = 6;

	let MainSectionSignIn   = document.getElementById("main-signed-in");
	let MainSectionSignOut  = document.getElementById("main-signed-out");
	let MainLoading         = document.getElementById("main-loading");
	let DeleteAccountButton = document.getElementById("delete-account-button");
	let SettingsMenu        = document.getElementById("settings");

	let sign_in_releated_elements  = [SettingsMenu,MainSectionSignIn];
	let sign_out_releated_elements = [MainSectionSignOut];
	let loading_related_elements   = [MainLoading];

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

							let SortedRoutineActivitiesKeys = Object.keys(Data.routine_activities).sort(
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

							HandleScheduleActivities     ({Days:Data.days,RoutineActivities:Data.routine_activities,UpdateUserDocByProperty:UpdateUserDocByProperty});
							CreateRoutineActivityEditors ({Days:Data.days,RoutineActivities:Data.routine_activities,UpdateUserDocByProperty:UpdateUserDocByProperty,SortedRoutineActivitiesKeys:SortedRoutineActivitiesKeys});
							CreateOneTimeActivityEditors ({Days:Data.days,RoutineActivities:Data.routine_activities,UpdateUserDocByProperty:UpdateUserDocByProperty});
							GenerateRoutineActivities    ({Days:Data.days,RoutineActivities:Data.routine_activities,UpdateUserDocByProperty:UpdateUserDocByProperty});
							ShowStatistics               ({Days:Data.days,RoutineActivities:Data.routine_activities,SortedRoutineActivitiesKeys:SortedRoutineActivitiesKeys});
						}
					);
				}
			);
		}
	);
}

function InitializeScheduleZoom(){
	let DayTabsContainerOverflowing = document.getElementById("day-tabs-container-overflowing");
	let ZoomRange = document.getElementById("zoom");

	ZoomRange.oninput = () => {
		DayTabsContainerOverflowing.style.height =  `${ZoomRange.value}%`;
	};
}

function InitializeTimeMarker(){
	let TimeMarker = document.getElementById("time-marker");
	let UpdateCurrentTimeMarker = () => {
		TimeMarker.style.top = `${(( (new Date()).getHours() * 60) + (new Date().getMinutes())) / (60*24) * 100}%`;
	}
	setInterval(UpdateCurrentTimeMarker, 1000*60);
	UpdateCurrentTimeMarker();
}

document.addEventListener('DOMContentLoaded',InitializeApp);