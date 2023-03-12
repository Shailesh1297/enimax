// RIP
var animixplay: extension = {
    baseURL: "https://animixplay.to",
    searchApi: async function (query: string) {
        const response: Array<extensionSearchData> = [];
        alert("Animixplay has been shut down.");
        return { status: 400, data: response } as extensionSearch;
    },

    getAnimeInfo: async function (url) {
        alert("Animixplay has been shut down.");
        return {
            "name": "",
            "image": "",
            "description": "",
            "episodes": [],
            "mainName": ""
        };
    },
    getLinkFromUrl:async function (url) {
        alert("Animixplay has been shut down.");
        return {
            sources: [],
            name: "",
            title: "",
            nameWSeason: "",
            episode: "",
            status: 400,
            message: "",
            next: null,
            prev: null
        };
    }
}