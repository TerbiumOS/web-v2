# <span style="color: #32ae62;">Creating Custom Settings Interfaces</span>

**Last Updated**: v2.3.0 - 04/11/2026

If you want your app settings to live inside the main Settings app, this guide shows how to add your own .tsl category, wire actions/scripts, and keep everything matching the built-in Terbium style.

## Table of Contents

- [Overview](#overview)
- [How Settings Loads .tsl Files](#how-settings-loads-tsl-files)
- [Required Manifests and TFS Paths](#required-manifests-and-tfs-paths)
- [TSL File Format](#tsl-file-format)
- [Supported Controls and Data Binding](#supported-controls-and-data-binding)
- [Using Actions](#using-actions)
- [Using Scripted Views](#using-scripted-views)
- [Reusable Styled Components](#reusable-styled-components)
- [Complete Example Category](#complete-example-category)
- [Troubleshooting](#troubleshooting)

## <span style="color: #32ae62;">Overview</span>

Terbium Settings is driven by TSL files placed in the Settings app folder. Each .tsl file becomes one settings category card on the home screen and one detail experience with sidebar views.

In short:

1. Create a new .tsl file.
2. Add a proper TSL Manifest + UI + Actions/Scripts.
3. Place it in the Settings app directory on TFS.
4. Open Settings and your category appears automatically.

## <span style="color: #32ae62;">How Settings Loads .tsl Files</span>

Settings reads all .tsl files from:

- /apps/system/settings.tapp/

The loader uses window.tb.system.TSLParser.parseTSL and then builds category cards from each parsed document.

Important behavior:

- Only files ending with .tsl are loaded.
- The category card appears only if the TSL has at least one quick link and one view.
- RecommendedOptions are used for quick links and search ranking.

## <span style="color: #32ae62;">Required Manifests and TFS Paths</span>

The TSL manifest contains the following inside of it (inside each .tsl)

Every .tsl file must define a top-level Manifest block:

- Id: unique id (example: settings.myapp)
- Title: card title and detail title
- Icon: icon key (material symbol name or keyword)
- Version
- Author

### TFS path conventions

Use TFS paths consistently when reading/writing config:

- User config: /home/<user>/settings.json
- System config: /system/etc/terbium/settings.json
- Settings app files: /apps/system/settings.tapp/

## <span style="color: #32ae62;">TSL File Format</span>

Minimal skeleton:

```xml
<TSL version="1.0">
	<Manifest>
		<Id>settings.myapp</Id>
		<Title>My App</Title>
		<Icon>settings</Icon>
		<Version>1.0</Version>
		<Author>Your Name</Author>
	</Manifest>

	<UI>
		<SettingsPage>
			<Sidebar>
				<Item id="general" title="General" icon="tune" default="true" />
			</Sidebar>

			<RecommendedOptions>
				<Option id="myapp.quick.general" text="Open general settings" view="general" />
			</RecommendedOptions>

			<Content>
				<View id="general">
					<Section title="General Settings">
						<Toggle label="Enable Feature" bind="myapp.general.enabled" />
						<Button label="Apply" action="applyGeneral" />
					</Section>
				</View>
			</Content>
		</SettingsPage>
	</UI>

	<Actions>
		<Action id="applyGeneral"><![CDATA[
			async function(context) {
				const enabled = !!(context.bindings && context.bindings["myapp.general.enabled"]);
				// save enabled to your app config
			}
		]]></Action>
	</Actions>
</TSL>
```

## <span style="color: #32ae62;">Supported Controls and Data Binding</span>

The generic renderer in Settings supports these section controls:

- Toggle
- Select
- Slider
- Button
- Text
- List

Examples:

```xml
<Toggle label="Enable" bind="myapp.enabled" />
<Select label="Mode" bind="myapp.mode" options="Fast,Safe,Balanced" />
<Slider label="Opacity" bind="myapp.opacity" min="0" max="100" step="1" />
<Text label="Endpoint" bind="myapp.endpoint" />
<List label="Hosts" bind="myapp.hosts" />
<Button label="Save" action="saveMyApp" />
```

Binding behavior:

- Controls with bind are collected into context.bindings.
- Button controls with action trigger a matching Action id.
- If a Button has no action, it renders disabled.

## <span style="color: #32ae62;">Using Actions</span>

Actions run through TSLParser.executeAction and receive context including:

- category
- viewId
- bindings

Use Actions for save/apply operations.

```xml
<Action id="saveNetwork"><![CDATA[
	async function(context) {
		const host = String(context.bindings?.["myapp.net.host"] || "").trim();
		const port = Number(context.bindings?.["myapp.net.port"] || 0);
		const user = await tb.user.username();
		const cfgPath = `/apps/user/${user}/myapp/config.json`;
		const cfg = { host, port };
		await tb.fs.promises.mkdir(`/apps/user/${user}/myapp`, { recursive: true });
		await tb.fs.promises.writeFile(cfgPath, JSON.stringify(cfg, null, 2), "utf8");
	}
]]></Action>
```

## <span style="color: #32ae62;">Using Scripted Views</span>

If you need custom layouts/cards (storage dashboards, app cards, advanced tables), add a Script block.

Script resolution checks ids in this order:

- script id = view id
- script id = categoryId.viewId
- script id = categoryId

Script module shape:

- loadingText: optional string
- render(context): returns HTML string (can be async)
- wire(root, context): attach events after HTML inject

```xml
<Scripts>
	<Script id="general" view="general"><![CDATA[
		const tb = api.tb;

		async function render() {
			return `<section><button type="button" class="detail-action" data-run="1">Run</button></section>`;
		}

		function wire(root) {
			root.querySelectorAll("[data-run]").forEach(btn => {
				btn.addEventListener("click", async () => {
					await tb.dialog.Alert({ title: "Done", message: "Action finished" });
				});
			});
		}

		return { loadingText: "Loading...", render, wire };
	]]></Script>
</Scripts>
```

## <span style="color: #32ae62;">Reusable Styled Components</span>

The Settings stylesheet already includes classes you can reuse in scripted views so your UI matches built-in sections.

Common reusable classes:

- detail-section-title
- detail-control-text
- detail-control-value
- detail-input
- detail-action

Card/list style classes:

- server-card-wrap
- server-card
- server-card is-online / is-offline
- installed-app-section
- installed-app-list
- installed-app-wrap
- installed-app-card
- installed-app-icon
- installed-app-icon-image
- installed-app-system-pill

Default icon helpers:

- defaults-inline-icon
- defaults-inline-icon is-monochrome

Storage dashboard classes (if building storage-like layouts):

- storage-dashboard
- storage-main-card
- storage-secondary-card
- storage-mini-card
- storage-open-btn

## <span style="color: #32ae62;">Complete Example Category</span>

1. Create file:

- /apps/system/settings.tapp/myapp.tsl

2. Add at minimum:

- Manifest with unique Id
- Sidebar with at least one Item
- RecommendedOptions with at least one Option
- Content with at least one View and Section

3. Add Actions for each button action id.

4. Reopen Settings.

Your category should appear on the home grid and be searchable.

## <span style="color: #32ae62;">Troubleshooting</span>

- Category not showing:
	- Make sure the file is in /apps/system/settings.tapp/
	- Verify .tsl extension
	- Ensure at least one Recommended Option and one View exist

- Button does nothing:
	- Confirm Button action matches an Action id exactly

- Binding values missing in action:
	- Confirm controls have bind attributes

- Scripted view not running:
	- Confirm Script id matches the active view id (or categoryId.viewId)
	- Return an object with a render function

- Styling looks off:
	- Reuse existing classes from /apps/system/settings.tapp/index.css instead of introducing random class names

With this pattern, you can keep all app settings centralized in Terbium Settings while still using your own storage format and advanced custom UI.
