type ExitFullscreen = typeof document.exitFullscreen
type RequestFullscreen = typeof document.documentElement.requestFullscreen
type TypeFunc = (res : Response) => Promise<string>

interface Document {
    webkitExitFullscreen: ExitFullscreen;
    mozCancelFullScreen: ExitFullscreen;
    msExitFullscreen: ExitFullscreen;
}

interface HTMLElement {
    webkitRequestFullscreen: RequestFullscreen;
    mozRequestFullScreen: RequestFullscreen;
    msRequestFullscreen: RequestFullscreen;
}

interface createElementConfig {
    element?: string,
    attributes?: { [key: string]: string },
    style?: { [key: string]: string },
    class?: string,
    id?: string,
    innerText?: string,
    innerHTML?: string,
    listeners?: { [key: string]: Function }
}

interface menuItemConfig {
    open?: string,
    attributes?: { [key: string]: string },
    classes?: Array<string>,
    iconID?: string,
    hideArrow?: boolean,
    callback?: Function,
    selected?: boolean,
    highlightable?: boolean,
    id?: string,
    text?: string,
    html?: string,
    altText?: string,
    textBox?: boolean,
    numberBox?: boolean,
    slider?: boolean,
    sliderConfig?: sliderConfig;
    value?: string,
    onInput?: Function,
    toggle?: boolean,
    color?: boolean,
    on?: boolean,
    toggleOn?: Function,
    toggleOff?: Function,
    selectedValue?: string,
    valueDOM?: HTMLElement,
    triggerCallbackIfSelected?: boolean,
}

interface sliderConfig {
    max: number,
    min: number,
    step: number
}

interface menuSceneConfig {
    config?: menuItemConfig,
    id: string,
    selectableScene?: boolean,
    heading?: menuItemConfig,
    items: Array<menuItemConfig>,
    element?: HTMLElement
}

interface skipData {
    start: number,
    end: number
}

interface videoSource {
    name: string,
    type: string,
    url: string,
    skipIntro?: skipData
}

interface videoSubtitle {
    file: string,
    label: string
}

interface videoData {
    next?: string | null,
    prev?: string | null,
    sources: Array<videoSource>,
    episode: number,
    name: string,
    nameWSeason: string,
    subtitles: Array<videoSubtitle>
    engine?: number
}

interface videoDoubleTapEvent extends CustomEvent {
    detail: {
        DTType: string
    }
}

interface videoOpenSettingsEvent extends CustomEvent {
    detail: {
        translate: number
    }
}

interface videoChangedFillModeEvent extends CustomEvent {
    detail: {
        fillMode: string
    }
}

interface cordovaWindow extends Window {
    cordova: any,
    makeLocalRequest(method: string, url: string): Promise<string>,
    apiCall: Function,
    returnExtensionList: Function,
    XMLHttpRequest: any,
    returnExtensionNames: Function,
    returnDownloadQueue: Function,
    returnExtensionDisabled: Function,
    listDir: Function,
    removeDirectory: Function,
    extractKey: Function,
    saveAsImport: Function,
    saveImage: Function,
    plugins: any,
    updateImage: Function,
    setFmoviesBase: Function,
    updateBackgroundBlur: Function,
    makeRequest: Function,
    resolveLocalFileSystemURL: Function
}

interface notiConfig {
    perm: number,
    color: string,
    head: string,
    notiData: string
}

interface sourceConfig {
    skipTo?: number,
    type: string,
    element?: HTMLElement | undefined,
    clicked: boolean,
    url?: string,
    name?: string,
}

interface modifiedString extends String {
    substringAfter: Function,
    substringBefore: Function,
    substringAfterLast: Function,
    substringBeforeLast: Function,
    onlyOnce: Function,
}

interface extension {
    baseURL: string,
    searchApi: (query: string) => Promise<extensionSearch>;
    getAnimeInfo: (url: string) => Promise<extensionInfo>;
    getLinkFromUrl: (url: any) => Promise<extensionVidSource>;
    discover?: () => Promise<Array<extensionDiscoverData>>;
    fixTitle?: (title: string) => string;
    [key: string]: any;
}

interface extensionSearchData {
    image: string,
    name: string,
    link: string
}

interface extensionSearch {
    status: number,
    data: Array<extensionSearchData>
}

interface extensionInfo {
    name: string,
    image: string,
    description: string,
    episodes: Array<extensionInfoEpisode>,
    mainName: string
    totalPages? : number
    pageInfo? : Array<PageInfo>
    genres?: Array<string>
}

interface PageInfo{
    pageSize : number,
    pageName : string
}

interface extensionInfoEpisode {
    link: string,
    title: string,
    id?: string,
    thumbnail?: string,
    description?: string
}

interface extensionVidSource {
    sources: Array<videoSource>,
    name: string,
    nameWSeason: string,
    episode: string,
    status: number,
    message: string,
    next: string | null,
    prev: string | null,
    title?: string,
    subtitles?: Array<videoSubtitle>
}

interface extensionDiscoverData {
    image: string,
    name: string,
    link: string | null,
    getLink?: boolean,
}



interface subtitleConfig {
    backgroundColor: string | null,
    backgroundOpacity: number | null,
    fontSize: number | null,
    lineHeight: number | null,
    color: string | null
}

interface flaggedShows {
    showURL: string,
    currentEp: string,
    dom: HTMLElement,
    name: string
}

interface queueElement {
    data: string,
    anime: extensionInfo,
    downloadInstance?: DownloadVid,
    mainUrl: string,
    title: string,
    errored?: boolean,
    message?: string
}

interface MessageAction {
    action: number | string,
    data: any
}


interface SourceDOMAttributes {
    "data-url": string,
    "data-type": string,
    "data-name": string,
    "data-intro"?: string,
    "data-start"?: number,
    "data-end"?: number
}

interface EnimaxConfig {
    "local": boolean,
    "remote": string,
    "remoteWOport": string,
    "chrome": boolean,
    "firefox": boolean,
    "beta": boolean,
    "sockets": boolean
}

interface downloadMapping {
    "fileName": string,
    "uri": string,
    "downloaded": boolean
}

interface LocalMapping {
    "fileName": string,
    "uri": string,
}
