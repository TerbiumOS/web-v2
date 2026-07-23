# <span style="color: #32ae62;">Liquor Compatibility</span>

**Last Updated**: v2.4.0 - 07/16/2026  
**Targets**: Anura v2.2.0-alpha APIs

Liquor is Terbium's compatibility layer for Anura applications. The name "Liquor" follows the tradition of compatibility layers like Wine (Wine Is Not an Emulator).

Liquor provides compatibility with Anura v2.2.0-alpha APIs, allowing most Anura applications to run on Terbium with minimal or no modifications. While we aim for high compatibility, some features differ due to architectural differences between Terbium and Anura.

## <span style="color: #32ae62;">API Support</span>

The table below compares Liquor's API support against the actual Anura v2.2.0-alpha implementation. APIs marked as "Full" are functionally complete and should work identically to Anura. "Partial" indicates working functionality with some limitations. "NO" indicates the API is not implemented.

| Anura API | Liquor Support | Notes |
| :--: | :---: | :--- |
| anura.fs (AnuraFilesystem) | Full | Complete filesystem implementation |
| anura.registerExternalApp() | Full | App registration works identically |
| anura.registerExternalLib() | Full | Library registration works identically |
| anura.notifications | Full | Note: Anura uses plural "notifications" |
| anura.x86 | **NO** | v86 backend not implemented in Terbium |
| anura.import() | Full | Library import system fully supported |
| anura.net (Networking) | Full | Network API with proxy support |
| anura.uri (URIHandler) | Partial | Working but some edge cases may differ |
| anura.wm (Window Manager) | Full | Full window management API |
| anura.config | Full | Configuration access |
| anura.files (FilesAPI) | Full | File handler system |
| anura.dialog | Full | Dialog system fully implemented |
| anura.platform | Full | Platform detection APIs |
| anura.processes | Partial | Process management with some stubs |
| anura.ui (AnuraUI) | Partial | UI system working, some features stubbed |
| anura.libs | Full | Library registry access |
| anura.apps | Full | App registry access |
| anura.version | Full | Version information object |
| anura.systray | Partial | System tray with limited functionality |
| anura.settings | Full | Settings management API |
| anura.logger | Full | Logging utilities |
| anura.ContextMenu | Full | Context menu system |

## <span style="color: #32ae62;">Important Notes</span>

### APIs That Don't Exist in Anura

Some APIs documented in older Anura materials do not actually exist in the Anura codebase:
- **anura.install** - Never existed; use `anura.registerExternalApp()` or `anura.registerExternalLib()` instead
- **anura.python** - Never existed; Python support was never implemented in Anura

### Libraries vs Direct APIs

- **anura.filePicker** - This is a **library**, not a direct API. Use: `await anura.import("anura.filepicker")`
- **anura.localfs** - This is a **class** that must be instantiated: `new LocalFS(...)`

### Key Differences from Anura

**Anura Plugins NOT Supported**: Service worker infrastructure differences prevent Anura plugins from working in Liquor. Terbium uses its own plugin system.

**BCC (Binary Communication Channel)**: Liquor includes BCC transport support, which is a **Terbium-specific feature**. BCC was never part of Anura - it's a Terbium refinement for proxy transport. This is the major architectural difference between Anura and Liquor now that BCC has been deprecated in Anura (because it never existed there) but is actively maintained in Terbium.

## <span style="color: #32ae62;">Bundled Applications & Libraries</span>

Liquor bundles the following Terbium-optimized versions of Anura apps and libraries:

| Component | Version | Type | Last Updated |
| :--: | :---: | :---: | :---: |
| fsapp.app | 2.0-tb | Application | 3/21/2025 |
| libfilepicker.lib | 2.0-tb | Library | 11/14/2024 |
| libfileview.lib | 2.0-tb | Library | 11/14/2024 |
| libpersist.lib | 2.0 | Library | 8/17/2024 |
| **anura.bcc** | **BX2-tb/BX1** | **Transport** | **11/25/2024** |

**Note**: All "-tb" suffixed versions are Terbium-specific builds with optimizations and compatibility improvements.

### BCC Transport Details

BCC (Binary Communication Channel) is Terbium's enhanced proxy transport layer:
- **Version**: BX2-tb (Terbium builds), BX1 (UPK only)
- **Purpose**: Efficient binary communication for proxied network requests
- **Status**: Actively maintained in Terbium as a core transport
- **Availability**: Standard builds (BX2-tb), UPK builds (BX1)
- **Performance**: Optimized for low latency and high throughput

BCC represents Terbium's commitment to maintaining and refining features that work well, even if they diverge from the upstream Anura project.
