# <span style="color: #32ae62;">Lemonade Compatibility</span>

**Last Updated**: v2.4.0 - 07/16/2026  
**Targets**: Electron v36.4.0 APIs

Lemonade is Terbium's compatibility layer for Electron applications. The name "Lemonade" follows the naming convention of Nintendo emulators (like Citra for Citrus, Yuzu for Yuzu fruit, etc.).

Lemonade targets Electron v36.4.0 API compatibility, allowing many Electron applications to run in Terbium's browser environment. While Electron runs on Node.js with native capabilities, Lemonade provides browser-compatible implementations of the most commonly used Electron APIs.

## <span style="color: #32ae62;">API Support</span>

Below is the current list of supported Electron APIs in Lemonade. More APIs will be added in future releases as needed by popular applications.

| Electron API | Lemonade Support | Stability | Notes |
| :--: | :---: | :---: | :--- |
| BrowserWindow | Full | Stable | Complete window management with all standard methods |
| Notification | Full | Stable | System notifications with full feature parity |
| Net | Full | Stable | Network requests via Terbium's proxy layer |
| Dialog | Full | Stable | File dialogs, message boxes, alerts, prompts |

**API Expansion Roadmap**: Additional Electron APIs (Menu, Tray, IPC, etc.) will be added based on community needs and application requirements. See [lemonade.md](./lemonade.md) for detailed API documentation and usage examples.
