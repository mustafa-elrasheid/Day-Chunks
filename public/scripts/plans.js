

function CreateActivityEditor (Activity,Days,UpdateEvent,TopMessage,SubmitButtonMessage,IconPath,OpenRotationDegree,DeleteAction = false,lockdays = false){

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

function CreateRoutineActivityEditors ({SortedRoutineActivitiesKeys,RoutineActivities,Days,UpdateUserDocByProperty}){
    let RoutineActivitiesEditor = document.getElementById("routine-activities-editor");
    RoutineActivitiesEditor.innerHTML = "";

    RoutineActivitiesEditor.appendChild(
        CreateActivityEditor({time:"00:00",duration_minutes:"",name:"",description:"",group:""},{},
            (activity,days) => {
                UpdateUserDocByProperty(`routine_activities.id_${Math.floor(Math.random()*1000000000)}`,{activity,days});
            },
            "Add Routine",
            "Add Routine",
            "/icons/plus.svg",
            45
        )
    );

    SortedRoutineActivitiesKeys.forEach(
        (routine_ActivityKey/* also the id */) => {
            let routine_activity = RoutineActivities[routine_ActivityKey];
            
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
                        delete RoutineActivities[routine_ActivityKey];
                    
                        UpdateUserDocByProperty(`routine_activities`,RoutineActivities);

                        Object.keys(Days).forEach(
                            (DayKey) => {
                                let Day = Days[DayKey];

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
}

function CreateOneTimeActivityEditors ({UpdateUserDocByProperty,Days,RoutineActivities}) {

    let OneTimeActivitiesEditor = document.getElementById("one-time-activities-editor");
    OneTimeActivitiesEditor.innerHTML = "";

    OneTimeActivitiesEditor.appendChild(
        CreateActivityEditor({time:"00:00",duration_minutes:"",name:"",description:"",group:""},{},
            (activity,days) => {
                Object.keys(days).forEach(
                    (DayKey) => {
                        if(!days[DayKey])return;
                        UpdateUserDocByProperty(`days.${DayKey}.activities.id_R${Math.floor(Math.random()*1000000000)}`,activity);	
                    }
                )
            },
            "Add One-time Activity",
            "Add One-time Activity",
            "/icons/plus.svg",
            45
        )
    );
    
    Object.keys(Days).forEach(
        (DayKey) => {
            let Day = Days[DayKey];
            Object.keys(Day.activities).forEach(
                (ActivityKey) => {
                    let activity = Day.activities[ActivityKey];
                    if(!(RoutineActivities[ActivityKey])){
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
}
