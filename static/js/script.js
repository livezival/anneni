var LANGUAGES = {
    "_": { defaultLanguage: "en", defaultVOLanguage: "en" },
    "en": {
        audioList: [
            // TODO audio random weight
            "audio/en/en_1.mp3",
            "audio/en/en_2.mp3",
            "audio/en/en_3.mp3"
        ],
        texts: {
            "page-title": "anneni",
            "doc-title": "anneni",
            "page-descriptions": "anneler tatlıdır, sadece yenir.<br>- senaolurgibi",
            "counter-descriptions": ["anneler", "anneler"],
            "counter-unit": "kez yendi",
            "counter-button": ["anne ye!", "anne ye!"],
            "options-txt-vo-lang": "ses dili",
            "options-txt-lang": "sayfa dili",
            "dialogs-close": "kapat",
        },
        cardImage: "img/card_en.jpg"
    },
};

const progress = [0, 1];

(() => {
    const $ = mdui.$;

    // initialize cachedObjects variable to store cached object URLs
    var cachedObjects = {};

    // function to try caching an object URL and return it if present in cache or else fetch it and cache it
    function cacheStaticObj(origUrl) {
        if (cachedObjects[origUrl]) {
            return cachedObjects[origUrl];
        } else {
            setTimeout(() => {
                fetch("static/" + origUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const blobUrl = URL.createObjectURL(blob);
                        cachedObjects[origUrl] = blobUrl;
                    })
                    .catch((error) => {
                        console.error(`Error caching object from ${origUrl}: ${error}`);
                    });
            }, 1);
            return origUrl;
        }
    };

    let firstSquish = true;

    // This code tries to retrieve the saved language 'lang' from localStorage. If it is not found or if its value is null, then it defaults to "en". 
    var current_language = localStorage.getItem("lang") || LANGUAGES._.defaultLanguage;
    var current_vo_language = localStorage.getItem("volang") || LANGUAGES._.defaultVOLanguage;

    // function that takes a textId, optional language and whether to use fallback/ default language for translation. It returns the translated text in the given language or if it cannot find the translation, in the default fallback language.
    function getLocalText(textId, language = null, fallback = true) {
        let curLang = LANGUAGES[language || current_language];
        let localTexts = curLang.texts;
        if (localTexts[textId] != undefined) {
            let value = localTexts[textId];
            if (value instanceof Array) {
                return randomChoice(value); // if there are multiple translations available for this text id, it randomly selects one of them and returns it.
            } else {
                return value;
            }
        }
        if (fallback) return getLocalText(textId, language = "en", fallback = false);
        else return null;
    }

    // function that updates all the relevant text elements with the translations in the chosen language.
    function multiLangMutation() {
        let curLang = LANGUAGES[current_language];
        let localTexts = curLang.texts;
        Object.entries(localTexts).forEach(([textId, value]) => {
            if (!(value instanceof Array))
                if (document.getElementById(textId) != undefined)
                    document.getElementById(textId).innerHTML = value; // replaces the innerHTML of the element with the given textId with its translated version.
        });
        refreshDynamicTexts()
        document.getElementById("anneni-card").src = "static/" + curLang.cardImage; // sets the image of element with id "anneni-card" to the translated version in the selected language.
    };

    multiLangMutation() // the function multiLangMutation is called initially when the page loads.

    // function that returns the list of audio files for the selected language
    function getLocalAudioList() {
        return LANGUAGES[current_vo_language].audioList;
    }

    // get global counter element and initialize its respective counts
    const localCounter = document.querySelector('#local-counter');
    let localCount = localStorage.getItem('count-v2') || 0;

    // display counter
    localCounter.textContent = localCount.toLocaleString('en-US');

    // initialize timer variable and add event listener to the counter button element
    const counterButton = document.querySelector('#counter-button');

    // Preload

    async function convertMp3FilesToBase64(dict) {
        const promises = [];
        for (const lang in dict) {
            if (dict.hasOwnProperty(lang)) {
                const audioList = dict[lang].audioList;
                if (Array.isArray(audioList)) {
                    for (let i = 0; i < audioList.length; i++) {
                        const url = audioList[i];
                        if (typeof url === "string" && url.endsWith(".mp3")) {
                            promises.push(loadAndEncode("static/" + url).then(result => dict[lang].audioList[i] = result));
                        }
                    }
                }
            }
        }
        progress[1] = promises.length
        await Promise.all(promises);
        return dict;
    }

    function upadteProgress() {
        progress[0] += 1
        counterButton.innerText = `${((progress[0] / progress[1]) * 100) | 0}%`
    }

    function loadAndEncode(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function () {
                upadteProgress()
                if (xhr.status === 200) {
                    const buffer = xhr.response;
                    const blob = new Blob([buffer], { type: "audio/mpeg" });
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        const base64data = reader.result;
                        resolve(base64data);
                    }
                } else {
                    reject(xhr.statusText);
                }
            };
            xhr.onerror = function () {
                upadteProgress()
                reject(xhr.statusText);
            };
            xhr.send();
        });
    }

    function addBtnEvent() {
        counterButton.addEventListener('click', (e) => {
            localCount++;
            localCounter.textContent = localCount.toLocaleString('en-US');
            localStorage.setItem('count-v2', localCount);
            triggerRipple(e);
            playAnneni();
            animateAnneni();
            refreshDynamicTexts();
        });
    };

    window.onload = function () {
        // Calling method
        convertMp3FilesToBase64(LANGUAGES)
            .catch(error => {
                console.error(error);
            })
            .finally(() => {
                refreshDynamicTexts();
                addBtnEvent();
                document.getElementById('loading').remove()
            });
    }


    // try caching the anneni1.gif and anneni2.gif images by calling the tryCacheUrl function
    cacheStaticObj("img/anneni1.gif");
    cacheStaticObj("img/anneni2.gif");

    // Define a function that takes an array as an argument and returns a random item from the array
    function randomChoice(myArr) {
        const randomIndex = Math.floor(Math.random() * myArr.length);
        const randomItem = myArr[randomIndex];
        return randomItem;
    }

    // Define a function that shuffles the items in an array randomly using Fisher-Yates algorithm
    function randomShuffle(myArr) {
        for (let i = myArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [myArr[i], myArr[j]] = [myArr[j], myArr[i]];
        }
        return myArr;
    }

    function getRandomAudioUrl() {
        var localAudioList = getLocalAudioList();
        if (current_vo_language == "en") {
            const randomIndex = Math.floor(Math.random() * 2) + 1;
            return localAudioList[randomIndex];
        }
        const randomIndex = Math.floor(Math.random() * localAudioList.length);
        return localAudioList[randomIndex];
    }

    function playAnneni() {
        let audioUrl;
        if (firstSquish) {
            firstSquish = false;
            audioUrl = getLocalAudioList()[0];
        } else {
            audioUrl = getRandomAudioUrl();
        }
        let audio = new Audio();//cacheStaticObj(audioUrl));
        audio.src = audioUrl;
        audio.play();
        audio.addEventListener("ended", function () {
            this.remove();
        });
    }

    function animateAnneni() {
        let id = null;
        const random = Math.floor(Math.random() * 2) + 1;
        const elem = document.createElement("img");
        elem.src = cacheStaticObj(`img/anneni${random}.gif`);
        elem.style.position = "absolute";
        elem.style.right = "-500px";
        elem.style.top = counterButton.getClientRects()[0].bottom + scrollY - 190 + "px"
        elem.style.zIndex = "-10";
        document.body.appendChild(elem);

        let pos = -500;
        const limit = window.innerWidth + 500;
        clearInterval(id);
        id = setInterval(() => {
            if (pos >= limit) {
                clearInterval(id);
                elem.remove()
            } else {
                pos += 20;
                elem.style.right = pos + 'px';
            }
        }, 12);
    };

    // This function creates ripples on a button click and removes it after 300ms.
    function triggerRipple(e) {
        let ripple = document.createElement("span");

        ripple.classList.add("ripple");

        const counter_button = document.getElementById("counter-button");
        counter_button.appendChild(ripple);

        let x = e.clientX - e.target.offsetLeft;
        let y = e.clientY - e.target.offsetTop;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        setTimeout(() => {
            ripple.remove();
        }, 300);
    };

    // This function retrieves localized dynamic text based on a given language code, and randomly replaces an element with one of the translations. 
    function refreshDynamicTexts() {
        if (progress[0] !== progress[1]) return;
        let curLang = LANGUAGES[current_language];
        let localTexts = curLang.texts;
        Object.entries(localTexts).forEach(([textId, value]) => {
            if (value instanceof Array)
                if (document.getElementById(textId) != undefined)
                    document.getElementById(textId).innerHTML = randomChoice(value);
        });
    };

    function showOptions() {
        mdui.dialog({
            title: 'ayarlar',
            content: `<div style="min-height: 350px;" class="mdui-typo">
    <label id="options-txt-lang">Page Language</label>
    <select id="language-selector" class="mdui-select" mdui-select='{"position": "bottom"}'>
        <option value="en">anneni</option>
    </select>
    <br />
    <label id="options-txt-vo-lang">Voice-Over Language</label>
    <select id="vo-language-selector" class="mdui-select" mdui-select='{"position": "bottom"}'>
        <option value="en">anneni</option>
    </select>
</div>`,
            buttons: [
                {
                    text: getLocalText("dialogs-close")
                }
            ],
            history: false,
            onOpen: (_inst) => {
                $("#vo-language-selector").val(current_vo_language);
                $("#language-selector").val(current_language);

                $("#language-selector").on("change", (ev) => {
                    current_language = ev.target.value;
                    localStorage.setItem("lang", ev.target.value);
                    multiLangMutation();
                });

                $("#vo-language-selector").on("change", (ev) => {
                    current_vo_language = ev.target.value;
                    localStorage.setItem("volang", ev.target.value);
                });

                multiLangMutation();
                mdui.mutation();
            }
        });
    }

    $("#show-options-opt").on("click", () => showOptions())
})(); 
