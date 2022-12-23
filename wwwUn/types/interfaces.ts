interface createElementConfig {
    element?: string,
    attributes?: { [key: string]: string } ,
    style?: { [key: string]: string },
    class?: string,
    id?: string,
    innerText?: string,
    innerHTML?: string,
    listeners?: { [key: string]: Function }
}

interface menuItemConfig {
    open?: string,
    attributes? : { [key: string]: string },
    classes? : Array<string>,
    iconID?: string,
    hideArrow? : boolean,
    callback?: Function,
    selected?: boolean,
    highlightable?: boolean,
    id?: string,
    text?: string,
    html?: string,
    altText? : string,
    textBox?: boolean,
    numberBox? : boolean,
    slider? : boolean,
    sliderConfig? : sliderConfig;
    value?: string,
    onInput?: Function,
    toggle?: boolean,
    color? : boolean,
    on?: boolean,
    toggleOn?: Function,
    toggleOff?: Function,
    selectedValue?: string,
    valueDOM?: HTMLElement,
    triggerCallbackIfSelected?: boolean,
}

interface sliderConfig{
    max : number,
    min : number,
    step : number
}

interface menuSceneConfig {
    config?: menuItemConfig,
    id: string,
    selectableScene? : boolean,
    heading?: menuItemConfig,
    items: Array<menuItemConfig>,
    element?: HTMLElement
}

interface skipData{
	start : number,
	end : number
}

interface videoSource{
	name : string,
	type : string,
	url : string,
	skipIntro? : skipData
}

interface videoSubtitle{
	file : string,
	label : string
}

interface videoData{
	next? : string | null,
	prev? : string | null,
	sources : Array<videoSource>,
	episode : number,
	name : string,
	nameWSeason : string,
	subtitles : Array<videoSubtitle>
	engine? : number
}

interface videoDoubleTapEvent extends Event{
	DTType : string
}

interface videoOpenSettingsEvent extends Event{
	translate : number
}

interface videoChangedFillModeEvent extends Event{
	fillMode : string
}

interface cordovaWindow extends Window{
	cordova : any,
	makeLocalRequest : Function,
	apiCall : Function,
	returnExtensionList: Function,
	XMLHttpRequest : any,
    returnExtensionNames : Function,
    returnDownloadQueue : Function,
    listDir : Function,
    removeDirectory : Function
}

interface notiConfig{
    perm : number,
    color : string,
    head : string,
    notiData : string
}

interface sourceConfig{
    skipTo? : number,
    type : string,
    element? : HTMLElement | undefined,
    clicked : boolean,
    url? : string
}

interface modifiedString  extends String{
    substringAfter : Function,
    substringBefore : Function,
    substringAfterLast : Function,
    substringBeforeLast : Function,
    onlyOnce : Function,
}

interface extension{
    baseURL : string,
    searchApi: (query: any) => Promise<unknown>;
    getAnimeInfo: (url: any) => Promise<{}>;
    getLinkFromUrl: (url: any) => Promise<{}>;
    config? : { [key: string]: string },
    discover?: () => Promise<any[]>;
    getDiscoverLink? : Function
}

interface extensionSearchData{
    image : string,
    name : string,
    link : string
}

interface extensionSearch{
    status : number,
    data : Array<extensionSearchData>
}

interface extensionInfo{
    name : string,
    image: string,
    description : string,
    episodes : Array<extensionInfoEpisode>,
    mainName : string
}

interface extensionInfoEpisode{
    link : string,
    title : string,
}

interface extensionVidSource{
    sources : Array<videoSource>,
    name: string,
    nameWSeason : string,
    episode : string,
    status : number,
    message: string
}

interface extensionDiscoverData{
    image : string,
    name : string,
    link : string | null,
    getLink? : boolean,
}



interface subtitleConfig{
    backgroundColor : string | null,
    backgroundOpacity : number | null,
    fontSize : number | null,
    lineHeight : number | null,
    color: string | null
}