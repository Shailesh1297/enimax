// @ts-ignore
const extensionList: Array<extension> = [wco, animixplay, fmovies, zoro, twitch, nineAnime, fmoviesto, gogo];

// @ts-ignore
const extensionNames = ["WCOforever", "Animixplay", "FlixHQ", "Zoro", "Twitch", "9anime", "Fmovies.to", "Gogoanime"];

// @ts-ignore
const extensionDisabled = [false, true, false, false, false, false, false];


async function anilistAPI(id) {

    const query = `
        query ($id: Int) {
            Media (id: $id, type: ANIME) { 
                id
                title {
                    romaji
                    english
                    native
                }
                coverImage { 
                    extraLarge 
                    large 
                    color 
                }
                bannerImage
                averageScore
                status(version: 2)
                idMal
                genres
                season
                seasonYear
                averageScore
                nextAiringEpisode { airingAt timeUntilAiring episode }
            }
        }`;

    const variables = {
        id
    };

    const url = 'https://graphql.anilist.co',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

    return JSON.parse(await MakeFetch(url, options)).data.Media;
}

async function getAnilistInfo(type: anilistType, id: string) {
    const anilistID = JSON.parse(await MakeFetch(`https://raw.githubusercontent.com/MALSync/MAL-Sync-Backup/master/data/pages/${type}/${id}.json`)).aniId;

    return await anilistAPI(anilistID);
}