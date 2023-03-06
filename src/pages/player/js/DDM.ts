/**
 * A toggle class
 */
class Toggle {
    element: HTMLElement;
    constructor(element: HTMLElement) {
        this.element = element;
    }

    /**
     * Turns the toggle on if it isn't already on
     */
    turnOn() {
        if (!this.isOn()) this.element.click();
    }
    /**
     * Turns the toggle off if it isn't already off
     */
    turnOff() {
        if (this.isOn()) this.element.click();
    }

    /**
     * Checks if the toggle is on
     * @returns true if the toggle is on. false otherwise
     */
    isOn() {
        return this.element.classList.contains("active");
    }

    /**
     * Toggles the toggle
     */
    toggle() {
        if (this.isOn()) this.turnOff();
        else this.turnOn();
    }
}


class Selectables {
    element: HTMLElement;
    DDMinstance: dropDownMenu;
    sceneID: string;
    sceneElem: HTMLElement;

    constructor(element: HTMLElement, DDMinstance : dropDownMenu, sceneID : string, sceneElem : HTMLElement) {
        this.element = element;
        this.DDMinstance = DDMinstance;
        this.sceneID = sceneID;
        this.sceneElem = sceneElem;
    }

    select() {
        Selectables.selectWithoutCallback(this.element, this.DDMinstance, this.sceneID, this.sceneElem);
    }

    selectWithCallback(){
        this.element.click();
    }

    static selectWithoutCallback(element : HTMLElement, DDMinstance : dropDownMenu, sceneID : string, sceneElem : HTMLElement){
        let parentElement = element.parentElement ? element.parentElement : sceneElem;
        let siblings = parentElement.children;

        for (let i = 0; i < siblings.length; i++) {
            let child = siblings[i];
            if (child.getAttribute("highlightable") === "true") {
                child.classList.remove("selected");
            }
        }

        element.classList.add("selected");

        if (sceneID) {
            let selectedValue = element.getAttribute("data-alttext");
            DDMinstance.selectedValues[sceneID] = selectedValue ? selectedValue : element.innerText;
            DDMinstance.updateSelectVals(sceneID);

        }
    }
}


class Scene {
    data: menuSceneConfig | undefined;
    DDMinstance: dropDownMenu | undefined;
    element: HTMLElement;

    /**
     * 
     * @param {menuSceneConfig} config the config that builds the scene
     * @param {dropDownMenu} dropDownMenuInstance The drop down menu that the scene is a part of
     * 
     */
    constructor(config: menuSceneConfig, dropDownMenuInstance: dropDownMenu) {
        this.data = config;
        this.DDMinstance = dropDownMenuInstance;
    }

    addItem(config: menuItemConfig, isHeading = false) {

        if (!this.DDMinstance) return;
        if (!this.data) return;

        let sceneElem = this.element.querySelector(".scene");

        let item = this.DDMinstance.makeItem(config, isHeading, this.data.id, <HTMLElement>sceneElem);
        sceneElem?.append(item);
        if(config.selected && config.triggerCallbackIfSelected === true) item.click();
        if (this.element.classList.contains("active")) this.DDMinstance.menuCon.style.height = (this.element.querySelector<HTMLElement>(".scene")?.offsetHeight ?? 100) + "px";
    }

    delete() {
        this.deleteItems();
        this.DDMinstance.deleteSceneFromHistory(this.data.id);
        delete this.DDMinstance.scenes[this.data.id];
        this.data = undefined;
        this.DDMinstance = undefined;
        this.element.remove();
    }

    deleteItems() {

        if (!this.DDMinstance) return;
        if (!this.data) return;

        let sceneDOM = this.element.querySelector(".scene");

        if (sceneDOM) sceneDOM.innerHTML = "";

        if (this.data.id in this.DDMinstance.selectedValues) this.DDMinstance.selectedValues[this.data.id] = "";

        this.DDMinstance.updateSelectVals(this.data.id);

        for (const item of this.data.items) this.DDMinstance.deleteItem(item);

        this.data.items = [];
    }
}

class dropDownMenu {
    scenes : { [key: string]: Scene } ;
    menuCon: HTMLElement;
    history: Array<string>;
    selections: {[key : string] : Selectables};
    toggles: {[key : string] : Toggle};
    selectedValues: {[key : string] : string};
    selectedValuesDOM: {[key : string] : {
            "elements" : Array<HTMLElement>
        }
    };
    constructor(scenes: Array<menuSceneConfig>, menuCon: HTMLElement) {
        this.scenes = {};
        this.menuCon = menuCon;
        this.history = [];
        this.toggles = {};
        this.selections = {};
        this.selectedValues = {};
        this.selectedValuesDOM = {};
        for (const scene of scenes) this.scenes[scene.id] = new Scene(scene, this);

        for (const scene of scenes) if (!this.scenes[scene.id].element) this.makeScene(scene);

        menuCon.onscroll = function () {
            menuCon.scrollLeft = 0;
        };
    }

    /**
     * Opens a scene
     * @param {string} id the sceneID 
     */
    open(id: string | undefined) {
        if (id && id in this.scenes) {

            if (!this.history.length || (this.history.length && this.history[this.history.length - 1] != id)) this.history.push(id);

            for (const sceneID in this.scenes) {
                if (sceneID === id) {
                    this.scenes[sceneID].element.classList.add("active");
                    this.menuCon.style.height = this.scenes[sceneID].element.querySelector<HTMLElement>(".scene").offsetHeight + "px";
                } else this.scenes[sceneID].element.classList.remove("active");
            }

        }
    }

    /**
     * Goes back to the the last-opened scene 
     * Closes the menu if it can't go back
     */
    back() {
        if (this.history.length > 1) {
            let lastHistory = this.history.pop();
            this.open(this.history.pop());
        } else this.closeMenu();
    }


    /**
     * Opens the menu
     */
    openMenu() {
        this.menuCon.style.pointerEvents = "auto";
        this.menuCon.style.opacity = "1";
    }


    /**
     * Closes the menu
     */
    closeMenu() {
        this.menuCon.style.pointerEvents = "none";
        this.menuCon.style.opacity = "0";
    }


    /**
     * 
     * @param {menuItemConfig} itemConfig the config object used to build the menuItem
     * @param {boolean} isHeading if the item is a heading or now
     * @param {string} sceneID the sceneID of the scene of which this menuItem is a part of 
     * @returns {HTMLElement}
     */
    makeItem(itemConfig: menuItemConfig, isHeading: boolean, sceneID: string, sceneElem : HTMLElement): HTMLElement {
        let item = itemConfig;
        let shouldShowValue = false;

        if (item.open) {
            item.selectedValue = this.selectedValues[item.open];
            if (this.scenes[item.open] instanceof Scene) shouldShowValue = this.scenes[item.open].data.selectableScene === true;
        }


        const tempConfig : createElementConfig = {
            "class": "menuItemText",
        };

        if(item.html){
            tempConfig.innerHTML = item.html;
        }else{
            tempConfig.innerText = item.text;
        }


        if(item.altText){
            tempConfig.attributes = {
                "data-alttext" : item.altText
            };
        }
        

        const menuConfig: createElementConfig = {
            "class": isHeading ? "menuHeading" : "menuItem",
        };

        if (item.attributes) menuConfig.attributes = item.attributes;

        const menuItem = createElement(menuConfig);
        const menuItemText = createElement(tempConfig);

        if (item.altText) {
            menuItem.setAttribute("data-alttext", item.altText);
        }

        if (item.classes) {
            for(let className of item.classes){
                menuItem.classList.add(className);
            }
        }

        if (!isHeading && "iconID" in item) {
            const menuItemIcon = createElement({
                "class": "menuItemIcon",
                "id": item.iconID
            });

            menuItem.append(menuItemIcon);
        }

        if (item.open) {
            menuItem.addEventListener("click", () => {
                this.open(item.open);
            });
        }



        if (isHeading && item.hideArrow !== true) {
            const menuItemIcon = createElement({
                "class": "menuItemIcon menuItemIconBack",
            });

            menuItem.addEventListener("click", () => {
                this.back();
            });

            menuItem.append(menuItemIcon);
        }

        if (item.callback) {
            menuItem.addEventListener("click", () => {
                item.callback?.bind(menuItem)();
            });
        }


        // Should be before selectWithoutCallback is called to make sure
        // .innerText is not an empty string
        menuItem.append(menuItemText);


        if (item.selected) {
            if (sceneID) {
                Selectables.selectWithoutCallback(menuItem, this, sceneID, sceneElem);
                this.updateSelectVals(sceneID);
            }
        }


        if (item.highlightable) {

            if (item.id) this.selections[item.id] = new Selectables(menuItem, this, sceneID, sceneElem);

            menuItem.setAttribute("highlightable", "true");
            menuItem.addEventListener("click", () => {
                Selectables.selectWithoutCallback(menuItem, this, sceneID, sceneElem);
            });
        }



        if (item.textBox || item.numberBox || item.color || item.slider) {
            let className = "textBox";
            let type = "text";

            if(item.numberBox){ 
                type = "number"; 
                className = "numberBox";
            }
            else if(item.color){
                type = "color";
                className = "colorBox";
            }
            else if(item.slider){
                type = "range";
                className = "sliderBox";
            }


            let attributes : any = {
                "type": type
            };

            if(item.slider){
                attributes["max"] = item.sliderConfig.max;
                attributes["step"] = item.sliderConfig.step;
                attributes["min"] = item.sliderConfig.min;
            }

            const inputBox = <HTMLInputElement>createElement({
                "element": "input",
                "class": className,
                "attributes": attributes
            });

            if (item.value) {
                inputBox.value = item.value;
            }

            inputBox.addEventListener("input", function (event) {
                if (item.onInput) item.onInput(event);
            });


            menuItem.append(inputBox);
        }


        if (shouldShowValue) {
            const valueDOM = createElement({
                "innerText": item.selectedValue,
                "class": "menuItemValue"
            });
            menuItem.append(valueDOM);

            item.valueDOM = valueDOM;

            if (item.open) {
                if (!this.selectedValuesDOM[item.open]) this.selectedValuesDOM[item.open] = {
                    "elements" : []
                };

                const sValue = this.selectedValuesDOM[item.open];

                if (sValue.elements) sValue.elements.push(valueDOM); 
                else sValue.elements = [valueDOM];
            }
        }


        if (item.open) {
            menuItem.append(createElement({
                "class": "menuItemIcon menuItemIconSub",
                "style": {
                    "marginLeft": item.selectedValue ? "3px" : "auto"
                }
            }))
        }
        if (item.toggle) {
            menuItem.classList.add("menuItemToggle");
            let toggle = createElement({
                "class": `toggle ${item.on ? " active" : ""}`,
                "listeners": {
                    "click": function () {
                        this.classList.toggle("active");
                        if (this.classList.contains("active")) {
                            item.toggleOn ? item.toggleOn() : "";
                        } else {
                            item.toggleOff ? item.toggleOff() : "";
                        }
                    }
                }

            });

            if (item.id)  this.toggles[item.id] = new Toggle(toggle);
            menuItem.append(toggle);
        }

        return menuItem;
    }

    /**
     * Updates all menuItems that point to the scene with a particular sceneID
     * @param {string} sceneID the sceneID of the scene whose selected values will be updated
     */
    updateSelectVals(sceneID: string) {
        if (this.selectedValuesDOM[sceneID]) for (const elems of this.selectedValuesDOM[sceneID].elements) elems.innerText = this.selectedValues[sceneID];
    }


    makeScene(config: menuSceneConfig): HTMLElement | undefined {
        const scene = createElement({
            "class": "scene"
        });

        const sceneCon = createElement({
            "class": "sceneCon"
        });


        const openScene = this.scenes[config.id];
        if (openScene?.element) {
            return;
        }

        if (config.heading) {
            scene.append(this.makeItem(config.heading, true, config.id, scene));
        }

        for (const item of config.items) {

            let newItemConfig = item;
            if (item.open) {
                const openScene = this.scenes[item.open];
                if (!openScene.element && openScene.data.selectableScene) this.makeScene(this.scenes[item.open].data);
            }

            scene.append(this.makeItem(newItemConfig, false, config.id, scene));
        }

        sceneCon.append(scene);
        this.scenes[config.id].element = sceneCon;
        this.menuCon.append(sceneCon);

        return sceneCon;
    }
    
    addScene(config: menuSceneConfig) {
        this.scenes[config.id] = new Scene(config, this);
        const sceneDIV = this.makeScene(config);
        if (sceneDIV) {
            this.menuCon.append(sceneDIV);
            config.element = sceneDIV;
        }
    }

    deleteScene(id: string) {
        if (id in this.scenes) {
            this.scenes[id].delete();
            delete this.scenes[id];
        }
    }

    deleteItem(item: menuItemConfig) {

        if (item.id && item.id in this.selections) delete this.selections[item.id];

        if (item.id && item.id in this.toggles) delete this.toggles[item.id];

        if (item.open) {
            const elem = this.selectedValuesDOM[item.open];
            if (elem) {
                const elements = elem.elements;
                let idx = elements.indexOf(item.valueDOM);
                if (idx > -1) elements.splice(idx, 1);
            }
        }
    }

    deleteSceneFromHistory(val: string) {
        for (let i = this.history.length - 1; i >= 0; i--) if (this.history[i] == val) this.history.splice(i, 1);
    }

    /**
     * 
     * @param {string} id the id of the toggle 
     * @returns {Toggle | null}
     */
    getToggle(id: string): Toggle | null {
        if (id in this.toggles) return this.toggles[id];
        return null;
    }

    /**
     * 
     * @param {string} id the id of the scene 
     * @returns {Scene | null}
     */
    getScene(id: string): Scene | null {
        if (id in this.scenes) return this.scenes[id];
        return null;
    }
}