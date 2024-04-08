
function TurnTabOnOrOff(button_id,tab_id,button_styling_choice_class,is_on){
    const button = document.getElementById(button_id);
    const tab = document.getElementById(tab_id);
    if(is_on){
        tab.hidden = false;
        button.setAttribute(
            "class",
            button_styling_choice_class
        );
    } else {
        tab.hidden = true;
        button.removeAttribute("class");
    }
}

function TurnTabsOnOrOff(tabs,tab_number){
    for(var x = 0;x < tabs.length;x++){
        const element = tabs[x];
        TurnTabOnOrOff(element.button_id,element.tab_id,element.button_styling_choice_class,x == tab_number);
    }
}