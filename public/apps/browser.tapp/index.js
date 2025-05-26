const Filer = window.Filer.fs;
const isURL = /^(https?:\/\/)?(www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}|localhost)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const create_new_id = () => {
    const id = Math.random().toString(36).substr(2, 9);
    if (document.getElementById(id)) {
        return create_new_id();
    }
    return id;
}

function customEncode(input) {
    if (input) {
        let str = input.toString();
        let charArray = str.split("");
        let encodedArray = charArray.map((char, index) => {
            if (index % 2) {
                return String.fromCharCode(2 ^ char.charCodeAt());
            } else {
                return char;
            }
        });
        let encodedString = encodedArray.join("");
        let finalResult = encodeURIComponent(encodedString);
        return finalResult;
    } else {
        return input;
    }
}

function customDecode(encodedString) {
    if (!encodedString) return encodedString;
    let [firstPart, ...restParts] = encodedString.split("?");
    let decodedString = decodeURIComponent(firstPart)
        .split("")
        .map((char, index) => (index % 2 ? String.fromCharCode(2 ^ char.charCodeAt(0)) : char))
        .join("");
    let finalResult = decodedString + (restParts.length ? "?" + restParts.join("?") : "");
    return finalResult;
}

const topbar_height = document.querySelector(".topbar").getBoundingClientRect().height;
document.body.style.setProperty(`--topbar-height`, `${document.querySelector(".topbar").getBoundingClientRect().height}px`);

const new_tab = document.querySelector(".new-tab");
new_tab.addEventListener("click", () => {
    newTab()
})

function closeTab(id) {
    const tab = document.getElementById(id);
    const tab_content = document.getElementById(id + "-content");
    tab.remove();
    window.parent.tb.mediaplayer.hide()
    tab_content.remove();
    const lastTab = document.querySelector(".tab:last-child");
    const lastTabContent = document.querySelector(".tab-content:last-child");
    if (lastTab && lastTabContent) {
        lastTab.classList.add("active");
        lastTabContent.classList.add("active");
    }
    if (!document.querySelector(".tab")) {
        newTab();
    }
}

function newTab() {
    let updateTab = false
    let interval
    const id = create_new_id();
    const tab = document.createElement("div");
    tab.classList.add("tab");
    tab.id = id;
    const tab_title = document.createElement("div");
    tab_title.classList.add("tab-title");
    tab_title.innerHTML = "New Tab";
    tab.appendChild(tab_title);
    const tab_close = document.createElement("img");
    tab_close.classList.add("tab-close");
    tab_close.src = "/apps/browser.tapp/close.svg";
    tab.appendChild(tab_close);
    document.querySelectorAll(".tab").forEach(otab => {
        if (otab.id != tab.id) {
            otab.classList.remove("active");
        }
    });
    tab.classList.add("active");
    document.querySelector(".tabs").appendChild(tab);
    const urlbar = document.createElement("input");
    const user = window.parent.sessionStorage.getItem('currAcc')
    urlbar.classList.add("urlbar");
    urlbar.addEventListener("focus", (e) => {
        document.querySelector(".searchbars").classList.add("focus");
    })
    urlbar.addEventListener("blur", (e) => {
        document.querySelector(".searchbars").classList.remove("focus");
    })
    urlbar.id = id + "-urlbar";
    urlbar.type = "text";
    urlbar.placeholder = "Search or enter a URL";
    urlbar.autocomplete = "off";
    urlbar.spellcheck = false;
    urlbar.addEventListener("focus", () => {
        urlbar.select();
    })
    document.querySelector(".searchbars").appendChild(urlbar);
    document.querySelectorAll(".urlbar").forEach(ourlbar => {
        if (ourlbar.id != urlbar.id) {
            ourlbar.classList.remove("active");
        }
    })
    urlbar.classList.add("active");
    urlbar.addEventListener("click", () => {
        updateTab = true
    })
    urlbar.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            updateTab = false
            const url = urlbar.value;
            const activeTab = document.querySelector(".tab.active");
            const activeTabContent = document.querySelector(".tab-content.active");
            if (url === "about:settings") {
                //activeTabContent.contentWindow.location = "/apps/browser.tapp/settings.html";
            } else {
                Filer.promises.readFile(`/home/${user}/settings.json`, "utf8").then((data) => {
                    let settings = JSON.parse(data);
                    let proxy = settings["proxy"];
                    if (url.match(isURL)) {
                        console.log("URL");
                        if (proxy === "Ultraviolet") {
                            activeTabContent.src = parent.window.location.origin + "/uv/service/" + customEncode(url);
                        } else if (proxy === "Scramjet") {
                            activeTabContent.src = parent.window.location.origin + "/service/" + customEncode(url);
                        } else {
                            activeTabContent.src = parent.window.location.origin + "/sw/" + customEncode(url);
                        }
                    } else {
                        let url = localStorage.getItem("sEngine") || "https://google.com/search?q=" + urlbar.value;
                        urlbar.value = url;
                        if (proxy === "Ultraviolet") {
                            activeTabContent.src = parent.window.location.origin + "/uv/service/" + customEncode(url);
                        } else if (proxy === "Scramjet") {
                            activeTabContent.src = parent.window.location.origin + "/service/" + customEncode(url);
                        } else {
                            activeTabContent.src = parent.window.location.origin + "/sw/" + customEncode(url);
                        }
                    }
                });
            }

            activeTabContent.onload = () => {
                const pageTitle = activeTabContent.contentDocument.title || "Untitled";
                const maxTitleLength = 8;
                const tabTitle = pageTitle.length > maxTitleLength ? pageTitle.substring(0, maxTitleLength) + '...' : pageTitle;
                activeTab.querySelector(".tab-title").innerHTML = tabTitle;
            };
        }
    })
    const tab_content = document.createElement("iframe");
    Filer.promises.readFile(`/home/${user}/settings.json`, "utf8").then((data) => {
        let settings = JSON.parse(data);
        let proxy = settings["proxy"];
        if (proxy === "Ultraviolet") {
            tab_content.src = parent.window.location.origin + "/uv/service/" + customEncode(localStorage.getItem("defUrl") || "https://www.google.com");
        } else {
            tab_content.src = parent.window.location.origin + "/service/" + customEncode(localStorage.getItem("defUrl") || "https://www.google.com");
        }
    });
    const unloadHandler = function () {
        setTimeout(function () {
            const pageTitle = tab_content.contentDocument.title || "Untitled";
            const maxTitleLength = 8;
            const tabTitle = pageTitle.length > maxTitleLength ? pageTitle.substring(0, maxTitleLength) + '...' : pageTitle;
            tab_title.innerHTML = tabTitle;
        }, 0);
    }
    tab_content.classList.add("tab-content");
    tab_content.id = id + "-content";
    const inject_engines = () => {
        if (document.querySelector(".left-arrow").classList.contains("disabled")) {
            document.querySelector(".left-arrow").classList.remove("disabled")
        }
        if ('__uv$location' in tab_content.contentDocument) {
            if (updateTab === false) {
                urlbar.value =  tab_content.contentDocument.__uv$location?.href
            }
        } else {
            if (updateTab === false) {
                urlbar.value = window.parent.$scramjet.codec.decode(tab_content.contentWindow.window.location.href.replace(/^.*\/service\//, ""))
            }
        }
        if (!tab_content.contentDocument.getElementById('tb-media-controller')) {
            const media_controller = document.createElement("script")
            const cursor_controller = document.createElement("script")
            media_controller.src = "/media_interactions.js"
            media_controller.id = "tb-media-controller"
            cursor_controller.src = "/cursor_changer.js"
            cursor_controller.id = "tb-cursor-controller"
            tab_content.contentDocument.head.appendChild(media_controller)
            tab_content.contentDocument.head.appendChild(cursor_controller)
        }
        if (!tab_content.contentDocument._hasKeydownListener) {
            tab_content.contentDocument.addEventListener("keydown", (e) => {
            if (e.altKey && e.key.toLowerCase() === "t") {
                newTab();
            } else if (e.altKey && e.key.toLowerCase() === "w") {
                closeTab(document.querySelector(".tab.active").id);
            } else if (e.altKey && e.key.toLowerCase() === "r") {
                const activeTabContent = document.querySelector(".tab-content.active");
                window.parent.tb.mediaplayer.hide()
                activeTabContent.contentWindow.location.reload();
            } else if (e.altKey && e.key.toLowerCase() === "b") {
                pwaIns();
            } else if (e.altKey && e.key.toLowerCase() === "k") {
                showTabs();
            } else if (e.altKey && e.key.toLowerCase() === "i") {
                if (typeof window.eruda === "undefined") {
                eruda.init();
                } else {
                if (window.eruda._isInit) {
                    window.eruda.destroy();
                } else {
                    window.eruda.init();
                }
                }
            }
            });
            tab_content.contentDocument._hasKeydownListener = true;
        }
    }
    if (!interval) {
        interval = setInterval(inject_engines, 1000);
    }
    tab_content.onload = () => {
        if (!interval) {
            interval = setInterval(inject_engines, 1000);
        }
        const pageTitle = tab_content.contentDocument.title || "Untitled";
        const maxTitleLength = 8;
        const tabTitle = pageTitle.length > maxTitleLength ? pageTitle.substring(0, maxTitleLength) + '...' : pageTitle;
        tab_title.innerHTML = tabTitle;
        let url = tab_content.src;
        url = url.replace(parent.window.location.origin, "");
        url = url.replace("/uv/service/", "");
        url = url.replace("/service/", "");
        tab_content.contentWindow.removeEventListener("unload", unloadHandler);
        tab_content.contentWindow.addEventListener("unload", unloadHandler);
        tab_content.contentWindow.addEventListener("load", unloadHandler);
        tab_content.contentWindow.removeEventListener("load", unloadHandler);
    };
    document.querySelector("main").appendChild(tab_content);
    document.querySelectorAll(".tab-content").forEach(otab => {
        if (otab.id != tab_content.id) {
            otab.classList.remove("active");
        }
    });

    tab_content.classList.add("active");
    tab.addEventListener("click", (e) => {
        if (e.target.classList.contains("tab-close")) return;
        if (e.target.classList.contains("tab-close")) {
            tab.remove();
            window.parent.tb.mediaplayer.hide()
            tab_content.remove();
            clearInterval(interval)
        }
        document.querySelectorAll(".tab").forEach(otab => {
            if (otab.id != tab.id) {
                otab.classList.remove("active");
            }
        });
        document.querySelectorAll(".tab-content").forEach(otab => {
            if (otab.id != tab_content.id) {
                otab.classList.remove("active");
            }
        });
        tab.classList.add("active");
        tab_content.classList.add("active");
        document.querySelectorAll(".urlbar").forEach(ourlbar => {
            if (ourlbar.id != urlbar.id) {
                ourlbar.classList.remove("active");
            }
        })
        urlbar.classList.add("active");
        let url = tab_content.src;
        url = url.replace(parent.window.location.origin, "");
        url = url.replace("/uv/service/", "");
        url = url.replace("/service/", "");
        urlbar.value = customDecode(url);
    });
    tab_close.addEventListener("click", () => {closeTab(id); clearInterval(interval)});
}

window.addEventListener("keypress", (e) => {
    if (e.shiftKey && e.key === "W") {
        e.preventDefault();
        newTab();
    } else if (e.shiftKey && e.key === "Q") {
        e.preventDefault();
        const tabId = document.querySelector(".tab.active").id;
        closeTab(tabId);
    }
})

window.onload = () => {
    newTab();
    let tabs = document.querySelector(".tabs");
    tabs.addEventListener("wheel", (e) => {
        if (e.deltaY > 0) {
            tabs.scrollLeft += 100;
        } else {
            tabs.scrollLeft -= 100;
        }
    })
}

document.querySelector(".refresh-button").addEventListener("click", () => {
    const activeTabContent = document.querySelector(".tab-content.active");
    window.parent.tb.mediaplayer.hide()
    activeTabContent.contentWindow.location.reload();
})

document.querySelector(".navigate-back").addEventListener("click", () => {
    if (window.history.canGoBack) {
        document.querySelector(".right-arrow").classList.remove("disabled");
        window.parent.tb.mediaplayer.hide()
        window.history.back()
    }
})

document.querySelector(".navigate-forward").addEventListener("click", () => {
    if (window.history.canGoForward) {
        window.parent.tb.mediaplayer.hide()
        window.history.forward()
    }
})

const pwaIns = async () => {
    const activeTabContent = document.querySelector(".tab-content.active");
    const pageTitle = activeTabContent.contentDocument.title || "Untitled";
    const maxTitleLength = 8;
    let tabTitle;
    if (pageTitle.includes(" - ")) {
        tabTitle = pageTitle.split(" - ")[0].trim();
    } else if (pageTitle.includes("|")) {
        tabTitle = pageTitle.split("|")[0].trim();
    } else {
        tabTitle = pageTitle.split(" ")[0].trim();
    }
    if (!tabTitle) {
        tabTitle = pageTitle.length > maxTitleLength ? pageTitle.substring(0, maxTitleLength) : pageTitle;
    }
    const favicon = activeTabContent.contentDocument.querySelector("link[rel~='icon']")?.href ||
                   activeTabContent.contentDocument.querySelector("link[rel='shortcut icon']")?.href ||
                   "/apps/browser.tapp/icon.svg";
    let data = JSON.parse(await Filer.promises.readFile("/apps/web_apps.json", "utf8"))
    await Filer.exists(`/apps/user/${await window.parent.tb.user.username()}/${tabTitle}/index.json`, async (exists) => {
        let apps = data.apps;
        if(apps.includes(tabTitle.toLowerCase()) || exists) {
            let index = apps.indexOf(tabTitle.toLowerCase());
            apps.splice(index, 1);
            data.apps = apps;
            await Filer.promises.writeFile("/apps/web_apps.json", JSON.stringify(data))
            window.parent.tb.launcher.removeApp(tabTitle);
            await (new Filer.Shell()).promises.rm(`/apps/user/${await window.parent.tb.user.username()}/${tabTitle}`, {recursive: true})
        } else {
            apps.push(tabTitle.toLowerCase());
            await Filer.promises.writeFile("/apps/web_apps.json", JSON.stringify(data))
            window.parent.tb.notification.Toast({
                "message": `${tabTitle} has been installed!`,
                "application": "App Store",
                "iconSrc": "/fs/apps/system/app store.tapp/icon.svg",
                "time": 5000,
            });
            await window.parent.tb.launcher.addApp({
                title: tabTitle,
                name: tabTitle,
                icon: `${window.location.origin}/uv/service/${await window.parent.tb.proxy.encode(favicon, "XOR")}`,
                src: await window.parent.tb.proxy.decode(document.querySelector(".tab-content.active").src.replace(window.location.origin, "").replace(/\/uv\/service\/|\/service\//, ""), "XOR"),
                size: {
                    width: 600,
                    height: 500
                },
                proxy: true,
            });
            console.log(tabTitle)
        }
    })
}

const showTabs = () => {
    if (document.querySelector(".tab-container").style.display === "none") {
        document.querySelector(".tab-container").style.display = "flex";
        document.querySelector("main").style.height = `calc(100% - calc(var(--topbar-height) + 10px))`;
        document.querySelector(".controls").style.marginTop = "0px";
    } else {
        document.querySelector(".controls").style.marginTop = "5px";
        document.querySelector("main").style.height = `100%`;
        document.querySelector(".tab-container").style.display = "none";
    }
}

const newengine = () => {
    window.parent.tb.dialog.Message({
        title: "Enter a new search engine",
        defaultValue: "https://google.com/search?q=",
        onOk: (value) => {
            localStorage.setItem("sEngine", value)
        },
    });
}

const nt = () => {
    window.parent.tb.dialog.Message({
        title: "Enter a new start page",
        defaultValue: "https://google.com",
        onOk: (value) => {
            localStorage.setItem("defUrl", value)
        },
    });
}

document.querySelector(".opt-menu").addEventListener("click", () => {
    const rect = document.querySelector(".opt-menu").getBoundingClientRect();
    window.parent.tb.contextmenu.create({
        x: rect.x - 150,
        y: rect.y + 125,
        options: [
            {
                text: "Toggle Tabs",
                click: () => showTabs()
            },
            {
                text: "Add site as PWA (beta)",
                click: async () => pwaIns()
            },
            {
                text: "Change default search engine",
                click: async () => newengine()
            },
            {
                text: "Change new tab page",
                click: async () => nt()
            },
            {
                text: "Toggle Eruda",
                click: () => {
                    if (typeof window.eruda === "undefined") {
                        eruda.init();
                    } else {
                        if (window.eruda._isInit) {
                            window.eruda.destroy();
                        } else {
                            window.eruda.init();
                        }
                    }
                }
            },
        ]
    })
})

window.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "t") {
        newTab();
    } else if (e.altKey && e.key.toLowerCase() === "w") {
        closeTab(document.querySelector(".tab.active").id);
    } else if (e.altKey && e.key.toLowerCase() === "r") {
        const activeTabContent = document.querySelector(".tab-content.active");
        window.parent.tb.mediaplayer.hide()
        activeTabContent.contentWindow.location.reload();
    } else if (e.altKey && e.key.toLowerCase() === "b") {
        pwaIns();
    } else if (e.altKey && e.key.toLowerCase() === "k") {
        showTabs();
    } else if (e.altKey && e.key.toLowerCase() === "i") {
        if (typeof window.eruda === "undefined") {
            eruda.init();
        } else {
            if (window.eruda._isInit) {
                window.eruda.destroy();
            } else {
                window.eruda.init();
            }
        }
    }
})