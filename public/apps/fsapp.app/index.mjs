// importing libaries
self.fflate = window.parent.tb.fflate;
self.mime = await anura.import("npm:mime");

self.currentlySelected = [];
self.clipboard = [];
self.removeAfterPaste = false;
self.fs = anura.fs;
self.filePicker = false;
self.Buffer = Filer.Buffer;
self.sh = new anura.fs.Shell();

// components
import { File } from "./components/File.mjs";
import { Folder } from "./components/Folder.mjs";
import { TopBar } from "./components/TopBar.mjs";
import { SideBar } from "./components/SideBar.mjs";
import { Selector } from "./components/Selector.mjs";

const url = new URL(window.location.href);
if (url.searchParams.get("picker")) {
    const picker = window.parent.ExternalApp.deserializeArgs(url.searchParams.get("picker"));
    if (picker) {
        self.filePicker = {};
        self.filePicker.regex = new RegExp(picker[0]);
        self.filePicker.type = picker[1];
        self.filePicker.multiple = picker[2];
        self.filePicker.id = picker[3];
    }
}

function App() {
    this.css = `
        background-color: var(--theme-bg);
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        .fileView {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
    `;

    return html`
        <div id="app">
            <${SideBar}></${SideBar}>
            <div class="fileView">
                <${TopBar}></${TopBar}>
                <hr>
                <table on:click=${(e) => {
                    if (e.currentTarget === e.target) {
                        currentlySelected.forEach((row) => {
                            row.classList.remove("selected");
                        });
                        currentlySelected = [];
                    }
                }}>
                    <thead>
                        <tr>
                            <th data-type="icon">
                                <span
                                    class="resize-handle hidden-resize-handle"
                                ></span>
                            </th>
                            <th data-type="name">
                                Name<span class="resize-handle"></span>
                            </th>
                            <th data-type="size">
                                Size<span class="resize-handle"></span>
                            </th>
                            <th data-type="type">
                                Type<span class="resize-handle"></span>
                            </th>
                            <th data-type="modified">
                                Date modified<span class="resize-handle"></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
            </div>
        </div>
    `;
}
self.loadPath = async (path) => {
    console.debug("loading path: ", path);
    const files = await fs.promises.readdir(path + "/");
    files.sort();
    console.debug("files: ", files);
    setBreadcrumbs(path);
    const table = document.querySelector("tbody");
    table.innerHTML = "";
    for (const file of files) {
        console.log(file);
        const stats = await fs.promises.stat(`${path}/${file}`);
        if (stats.isDirectory()) {
            const element = html`<${Folder} path=${path} file=${file} stats=${stats}></${File}>`;
            // oh my god this is horrid
            table.appendChild(element.children[1].children[0]);
        } else {
            const ext = file.split("/").pop().split(".").pop();
            const element = html`<${File} path=${path} file=${file} stats=${stats}></${File}>`;
            console.log(element);
            if (
                self.filePicker &&
                self.filePicker.type !== "dir" &&
                self.filePicker.regex.test(ext)
            ) {
                table.appendChild(element.children[1].children[0]);
            } else if (!self.filePicker) {
                console.log(element.children[1].children[0]);
                table.appendChild(element.children[1].children[0]);
            }
        }
    }
};
document.body.appendChild(html`<${App} />`);
if (filePicker) {
    document
        .getElementById("app")
        .appendChild(html`<${Selector}></${Selector}>`);
}
loadPath("/");
