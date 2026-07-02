# <span style="color: #32ae62;">Creating Custom Settings Interfaces</span>

**Last Updated**: v2.4.0 - 07/02/2026

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

### Basic Structure

A TSL file is an XML document with three main sections:
1. **Manifest** - metadata about your settings category
2. **UI** - the visual structure including sidebar navigation and content views
3. **Actions/Scripts** - JavaScript functions that handle button clicks and custom rendering

### Minimal skeleton:

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

### Understanding the Components

**Manifest Section:**
- `Id`: Must be unique across all settings categories. Use reverse-domain notation (e.g., `settings.myapp`)
- `Title`: Displayed on the settings card and detail page header
- `Icon`: Material Symbols icon name (e.g., `tune`, `settings`, `apps`)
- `Version` and `Author`: Metadata for tracking

**Sidebar:**
- Each `<Item>` creates a navigation entry in the detail view sidebar
- `id`: Must match a View id in the Content section
- `title`: Display text for the sidebar item
- `icon`: Material Symbols icon name
- `default="true"`: Optional, marks this view as the initial view when opening the category

**RecommendedOptions:**
- Creates quick-access links on the settings home screen
- Also makes your settings searchable
- `id`: Unique identifier for the option
- `text`: Display text shown in search results and quick links
- `view`: The View id to navigate to when clicked

**Content Views:**
- Each `<View>` corresponds to a sidebar item
- Contains one or more `<Section>` blocks
- Sections can have titles and contain controls

**Actions:**
- JavaScript functions wrapped in CDATA
- Receive a `context` object with `category`, `viewId`, and `bindings`
- Use `async function(context) { }` format
- Access the Terbium API via `tb` (e.g., `tb.fs.promises.writeFile`)

## <span style="color: #32ae62;">Supported Controls and Data Binding</span>

The generic renderer in Settings supports these section controls:

### Toggle
Switch control for boolean values.
```xml
<Toggle label="Enable Feature" bind="myapp.enabled" />
```
- `label`: Display text next to the toggle
- `bind`: Key for storing the boolean value in context.bindings

### Select
Dropdown menu for selecting one option from a list.
```xml
<Select label="Mode" bind="myapp.mode" options="Fast,Safe,Balanced" />
```
- `label`: Display text for the dropdown
- `bind`: Key for storing the selected value
- `options`: Comma-separated list of options

### Slider
Range input for numeric values.
```xml
<Slider label="Opacity" bind="myapp.opacity" min="0" max="100" step="1" />
```
- `label`: Display text for the slider
- `bind`: Key for storing the numeric value
- `min`, `max`: Range boundaries
- `step`: Increment/decrement step size

### Text
Single-line text input field.
```xml
<Text label="Endpoint URL" bind="myapp.endpoint" />
```
- `label`: Display text for the input field
- `bind`: Key for storing the text value

### List
Multi-line text area for lists (one item per line).
```xml
<List label="Blocked Hosts" bind="myapp.hosts" />
```
- `label`: Display text for the text area
- `bind`: Key for storing the list value (string with newlines)

### Button
Action button that triggers a function.
```xml
<Button label="Save Settings" action="saveMyApp" />
```
- `label`: Button text
- `action`: ID of the Action to execute (must match an Action id in the Actions section)

### Binding behavior:

- All controls with a `bind` attribute automatically collect their values into `context.bindings`
- When an Action is triggered, it receives `context.bindings` with all bound values from the current view
- Button controls with `action` attributes trigger the matching Action id
- Buttons without an `action` attribute render as disabled
- Binding keys should follow a consistent naming pattern (e.g., `appname.section.setting`)

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

Here's a complete, realistic example that demonstrates all the key features:

```xml
<TSL version="1.0">
	<Manifest>
		<Id>settings.myapp</Id>
		<Title>My Application</Title>
		<Icon>extension</Icon>
		<Version>1.0.0</Version>
		<Author>Your Name</Author>
	</Manifest>

	<UI>
		<SettingsPage>
			<Sidebar>
				<Item id="general" title="General" icon="tune" default="true" />
				<Item id="network" title="Network" icon="wifi" />
				<Item id="advanced" title="Advanced" icon="settings" />
			</Sidebar>

			<RecommendedOptions>
				<Option id="myapp.quick.general" text="Configure My App" view="general" />
				<Option id="myapp.quick.network" text="Network Settings" view="network" />
			</RecommendedOptions>

			<Content>
				<!-- General Settings View -->
				<View id="general">
					<Section title="Basic Configuration">
						<Toggle label="Enable My App" bind="myapp.general.enabled" />
						<Select label="Theme" bind="myapp.general.theme" options="Light,Dark,Auto" />
						<Slider label="Opacity" bind="myapp.general.opacity" min="0" max="100" step="5" />
						<Button label="Apply General Settings" action="applyGeneral" />
					</Section>
				</View>

				<!-- Network Settings View -->
				<View id="network">
					<Section title="Connection Settings">
						<Text label="API Endpoint" bind="myapp.network.endpoint" />
						<Text label="Port" bind="myapp.network.port" />
						<Toggle label="Use HTTPS" bind="myapp.network.useHttps" />
						<Button label="Test Connection" action="testConnection" />
						<Button label="Save Network Settings" action="saveNetwork" />
					</Section>
				</View>

				<!-- Advanced Settings View (with scripted content) -->
				<View id="advanced">
					<!-- This view is rendered by the Script below -->
				</View>
			</Content>
		</SettingsPage>
	</UI>

	<Actions>
		<!-- Apply General Settings -->
		<Action id="applyGeneral"><![CDATA[
			async function(context) {
				const enabled = !!(context.bindings && context.bindings["myapp.general.enabled"]);
				const theme = String(context.bindings?.["myapp.general.theme"] || "Auto");
				const opacity = Number(context.bindings?.["myapp.general.opacity"] || 100);
				
				// Get current user
				const user = await tb.user.username();
				const cfgPath = `/apps/user/${user}/myapp/config.json`;
				
				// Load existing config or create new one
				let cfg = {};
				try {
					const existing = await tb.fs.promises.readFile(cfgPath, "utf8");
					cfg = JSON.parse(existing);
				} catch (e) {
					// Config doesn't exist yet, will create new one
				}
				
				// Update settings
				cfg.enabled = enabled;
				cfg.theme = theme;
				cfg.opacity = opacity;
				
				// Save config
				await tb.fs.promises.mkdir(`/apps/user/${user}/myapp`, { recursive: true });
				await tb.fs.promises.writeFile(cfgPath, JSON.stringify(cfg, null, 2), "utf8");
				
				// Show success message
				await tb.notification.Toast({
					message: "General settings saved successfully",
					application: "Settings",
					iconSrc: "/fs/apps/system/settings.tapp/icon.svg",
					time: 3000
				});
			}
		]]></Action>

		<!-- Test Network Connection -->
		<Action id="testConnection"><![CDATA[
			async function(context) {
				const endpoint = String(context.bindings?.["myapp.network.endpoint"] || "");
				const port = String(context.bindings?.["myapp.network.port"] || "");
				const useHttps = !!(context.bindings?.["myapp.network.useHttps"]);
				
				if (!endpoint) {
					await tb.dialog.Alert({
						title: "Error",
						message: "Please enter an API endpoint"
					});
					return;
				}
				
				const protocol = useHttps ? "https" : "http";
				const url = `${protocol}://${endpoint}${port ? ':' + port : ''}`;
				
				try {
					// Test connection (example - adapt to your needs)
					const response = await fetch(url);
					if (response.ok) {
						await tb.dialog.Alert({
							title: "Success",
							message: `Connected to ${url} successfully!`
						});
					} else {
						throw new Error(`HTTP ${response.status}`);
					}
				} catch (e) {
					await tb.dialog.Alert({
						title: "Connection Failed",
						message: `Could not connect to ${url}: ${e.message}`
					});
				}
			}
		]]></Action>

		<!-- Save Network Settings -->
		<Action id="saveNetwork"><![CDATA[
			async function(context) {
				const endpoint = String(context.bindings?.["myapp.network.endpoint"] || "").trim();
				const port = Number(context.bindings?.["myapp.network.port"] || 0);
				const useHttps = !!(context.bindings?.["myapp.network.useHttps"]);
				
				const user = await tb.user.username();
				const cfgPath = `/apps/user/${user}/myapp/config.json`;
				
				let cfg = {};
				try {
					const existing = await tb.fs.promises.readFile(cfgPath, "utf8");
					cfg = JSON.parse(existing);
				} catch (e) {}
				
				cfg.network = { endpoint, port, useHttps };
				
				await tb.fs.promises.mkdir(`/apps/user/${user}/myapp`, { recursive: true });
				await tb.fs.promises.writeFile(cfgPath, JSON.stringify(cfg, null, 2), "utf8");
				
				await tb.notification.Toast({
					message: "Network settings saved",
					application: "Settings",
					iconSrc: "/fs/apps/system/settings.tapp/icon.svg",
					time: 3000
				});
			}
		]]></Action>
	</Actions>

	<Scripts>
		<!-- Custom scripted view for advanced settings -->
		<Script id="advanced" view="advanced"><![CDATA[
			const tb = api.tb;

			async function render() {
				const user = await tb.user.username();
				const cfgPath = `/apps/user/${user}/myapp/config.json`;
				
				let cfg = {};
				try {
					const existing = await tb.fs.promises.readFile(cfgPath, "utf8");
					cfg = JSON.parse(existing);
				} catch (e) {}
				
				return `
					<section>
						<div class="detail-section-title" style="margin-bottom: 1rem;">Advanced Settings</div>
						<div class="server-card-wrap" style="gap: 0.75rem;">
							<div class="server-card">
								<div style="display: flex; gap: 0.75rem; align-items: center;">
									<span class="material-symbols-outlined" style="font-size: 28px; color: rgba(255,255,255,0.7);">
										info
									</span>
									<div>
										<div class="detail-control-text" style="font-weight: 600;">Configuration Path</div>
										<div class="detail-control-value">${cfgPath}</div>
									</div>
								</div>
							</div>
							<div class="server-card">
								<div style="display: flex; gap: 0.75rem; align-items: center;">
									<span class="material-symbols-outlined" style="font-size: 28px; color: rgba(255,255,255,0.7);">
										data_object
									</span>
									<div style="flex: 1;">
										<div class="detail-control-text" style="font-weight: 600;">Raw Configuration</div>
										<pre style="margin-top: 0.5rem; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 8px; overflow-x: auto; font-size: 12px;">${JSON.stringify(cfg, null, 2)}</pre>
									</div>
								</div>
							</div>
							<button type="button" class="detail-action" data-reset="1">
								Reset to Defaults
							</button>
						</div>
					</section>
				`;
			}

			function wire(root) {
				root.querySelectorAll("[data-reset]").forEach(btn => {
					btn.addEventListener("click", async () => {
						const confirmed = await new Promise(resolve => {
							tb.dialog.Select({
								title: "Reset Settings",
								message: "Are you sure you want to reset all settings to defaults?",
								options: [
									{ text: "Yes, reset", value: "yes" },
									{ text: "Cancel", value: "no" }
								],
								onOk: val => resolve(val === "yes")
							});
						});
						
						if (confirmed) {
							const user = await tb.user.username();
							const cfgPath = `/apps/user/${user}/myapp/config.json`;
							try {
								await tb.fs.promises.unlink(cfgPath);
								await tb.notification.Toast({
									message: "Settings reset successfully",
									application: "Settings",
									iconSrc: "/fs/apps/system/settings.tapp/icon.svg",
									time: 3000
								});
								// Trigger re-render
								window.dispatchEvent(new CustomEvent('settings:reload'));
							} catch (e) {
								await tb.dialog.Alert({
									title: "Error",
									message: `Failed to reset settings: ${e.message}`
								});
							}
						}
					});
				});
			}

			return { loadingText: "Loading advanced settings...", render, wire };
		]]></Script>
	</Scripts>
</TSL>
```

### Step-by-Step Integration Guide

1. **Create your TSL file**:
   ```bash
   # Place your file in the Settings app directory
   /apps/system/settings.tapp/myapp.tsl
   ```

2. **Start with the Manifest**:
   - Choose a unique ID (use reverse-domain notation)
   - Pick an appropriate icon from Material Symbols
   - Set your title, version, and author

3. **Design your UI structure**:
   - List out what settings your app needs
   - Group related settings into logical sections
   - Decide which views need sidebar navigation

4. **Create the Sidebar**:
   - Add one `<Item>` for each major settings category
   - Mark one as `default="true"` for the initial view
   - Use descriptive icons for each item

5. **Add RecommendedOptions**:
   - Create at least one quick-access option
   - These appear on the Settings home screen
   - They also make your settings searchable

6. **Build Content Views**:
   - Create a `<View>` for each Sidebar item
   - Use `<Section>` blocks to group related controls
   - Add appropriate controls (Toggle, Select, etc.)
   - Bind each control to a unique key

7. **Implement Actions**:
   - Write an Action for each Button
   - Access bound values via `context.bindings`
   - Save settings to your app's config file
   - Show feedback notifications on success/error

8. **Test your integration**:
   - Reload the Settings app
   - Verify your category appears on the home screen
   - Test each view in the detail page
   - Confirm all Actions work correctly
   - Check that settings persist after reload

9. **Add advanced features** (optional):
   - Use Scripts for custom layouts
   - Implement dynamic content loading
   - Add validation and error handling
   - Style using existing Settings classes

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
