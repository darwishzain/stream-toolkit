## To Use
Copy example user JSON `browser/example/user.json` into browser/user.json.
```
# Linux
cp browser/example/user.json browser/user.json

# Windows
copy browser/example/user.json browser/user.json
```
Update `browser/user.json` with your information


Format for `user.json`
```
{
    "username":"yourusername",
    "theme":"dark",
    "socials":{
        "tiktok":
        {
            "label":"Tiktok",
            "icon":"bi bi-tiktok"
        },
        "instagram":
        {
            "label":"Instagram",
            "icon":"bi bi-instagram"
        },
        "youtube":
        {
            "label":"Youtube",
            "icon":"bi bi-youtube"
        },
        "daun":
        {
            "label":"Daun",
            "icon":"bi bi-leaf-fill"
        }
    }
}
```

### Music Source
[Riot Music](https://www.riotgames.com/en/riot-music-creator-safe-guidelines)
[streambeats](https://streambeats.com/)

## Development Tool
### Tools Version
| File Name | Version | Location |
|---|---|:---:|
| [tmi.min.js](https://github.com/tmijs/tmi.js/releases/download/v1.8.5/tmi.min.js) `download` | v1.8.5 | Local `browser/tmi.min.js` |
| [comfy.min.js](https://cdn.jsdelivr.net/npm/comfy.js@latest/dist/comfy.min.js) `cdn` | v1.1.27 | [CDN](https://cdn.jsdelivr.net/npm/comfy.js@latest/dist/comfy.min.js)|

## Issues
- momentum didn't detect audio when added to obs
- Twitch extension is not working yet