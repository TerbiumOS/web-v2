window.addEventListener("message", e => {
	let data = JSON.parse(e.data);
	let file_name = data.details.name;
	let tof = data.details.type;
	let loc = data.path;
	let size = data.details.size;
	if (size > 1000000000) {
		size = `${(size / 1000000000).toFixed(2)} GB`;
	} else if (size > 1000000) {
		size = `${(size / 1000000).toFixed(2)} MB`;
	} else if (size > 1000) {
		size = `${(size / 1000).toFixed(2)} KB`;
	} else {
		size = `${size} B`;
	}
	let created = data.details.created;
	let createdDate = new Date(created);
	created = `${createdDate.getFullYear()}-${createdDate.getMonth()}-${createdDate.getDate()}`;
	let modified = data.details.modified;
	let modifiedDate = new Date(modified);
	modified = `${modifiedDate.getFullYear()}-${modifiedDate.getMonth()}-${modifiedDate.getDate()}`;
	let accessed = data.details.accessed;
	let accessedDate = new Date(accessed);
	accessed = `${accessedDate.getFullYear()}-${accessedDate.getMonth()}-${accessedDate.getDate()}`;
	document.body.innerHTML = `
        <div class="flex flex-col h-full py-2 px-4">
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">Name:</div>
                <div class="text-base font-bold">${file_name}</div>
            </div>
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">Type of file:</div>
                <div class="text-base font-bold">${tof}</div>
            </div>
            ${
				data.details.mime
					? `
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">MIME:</div>
                <div class="text-base font-bold">${data.details.mime}</div>
            </div>
            `
					: ``
			}
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">Location:</div>
                <div class="text-base font-bold">${loc}</div>
            </div>
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">Size:</div>
                <div class="text-base font-bold">${size}</div>
            </div>
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">Created:</div>
                <div class="text-base font-bold">${created}</div>
            </div>
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">Modified:</div>
                <div class="text-base font-bold">${modified}</div>
            </div>
            <div class="flex gap-1 items-center">
                <div class="text-lg font-extrabold">Accessed:</div>
                <div class="text-base font-bold">${accessed}</div>
            </div>
        </div>
    `;
});
