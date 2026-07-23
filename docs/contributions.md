# <span style="color: #32ae62;">How to Contribute to Terbium v2</span>

**Last Updated**: v2.4.0 - 07/16/2026

We welcome contributions to Terbium v2! Whether you're fixing bugs, adding features, improving documentation, or creating applications, your contributions help make Terbium better for everyone.

Table of Contents
- [Getting Started](#getting-started)
- [Understanding the File Structure](#understanding-the-file-structure)
- [What Should and Shouldn't Be Modified](#learning-what-should-and-shouldnt-be-touched)
- [Development Workflow](#development-workflow)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## <a name="getting-started" style="color: #32ae62;">Getting Started</a>

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm/yarn
- **Git** for version control
- Basic knowledge of TypeScript and React

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/terbium.git
   cd terbium
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/TerbiumOS/terbium.git
   ```
4. **Install dependencies**:
   ```bash
   pnpm install
   ```
5. **Start the development server**:
   ```bash
   pnpm dev
   ```

## <a name="understanding-the-file-structure" style="color: #32ae62;">Understanding the File Structure</a>

Terbium v2 is primarily written in [React](https://react.dev) with TypeScript. Here's the key directory structure:

### Core Directories

#### `/src/` - Frontend Source Code
The main source directory containing all frontend code and APIs:

- **`/src/sys/`** - System-critical code (contains all core functionality)
  - **`/src/sys/gui/`** - All GUI components and layouts (Shell, Desktop, WindowArea, Dock, etc.)
    - **`/src/sys/gui/styles/`** - Component stylesheets
  - **`/src/sys/liquor/`** - Anura compatibility layer (Liquor)
  - **`/src/sys/apis/`** - Core Terbium APIs (Dialogs, Notifications, System utilities, etc.)
  - **`/src/sys/lemonade/`** - Electron compatibility layer (Lemonade)
  
- **`/src/init/`** - Initialization and bootstrap code (index.ts, fs.init.ts)
- **`/src/Login.tsx`** - Login screen component (root-level file, not a directory)
- **`/src/App.tsx`** - Main application component
- **`/src/Updater.tsx`** - Application update management

#### `/public/` - Static Assets
Static files served directly, including:
- **`/public/apps/`** - TAPP applications (about.tapp, browser.tapp, files.tapp, terminal.tapp, etc.)
  - Each app is a `.tapp` directory with `.tbconfig` and associated files
- **`/public/lib/`** - Shared libraries (dreamland, etc.)
- **`/public/fonts/`** - Font files (Inter.ttf)
- **`/public/assets/`** - Images, wallpapers, icons
- **`/public/cursors/`** - Custom cursor themes (light/dark)
- **`/public/anura-sw.js`** - Service worker for Anura compatibility

#### `/docs/` - Documentation
All project documentation, including this file.

#### `/server/` - Backend Server
Node.js backend for proxying, MASQR, and Wisp.

### Other Important Files

- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`vite.config.ts`** - Build configuration (Vite)
- **`.env`** - Backend environment configuration

## <a name="learning-what-should-and-shouldnt-be-touched" style="color: #32ae62;">What Should and Shouldn't Be Modified</a>

### ⚠️ Critical System Files (Exercise Caution)

**Think twice before modifying these:**

- **`/src/sys/`** - System-critical APIs and components
  - Only modify if you fully understand the impact
  - Changes here can break core functionality
  - Test extensively before submitting PRs

- **TypeScript configuration files**:
  - `tsconfig.json`
  - `vite.config.ts`
  - Only change if you're addressing a specific build or type issue

- **Service workers** in `/public/`
  - Modifications can break offline functionality and caching

### ✅ Safe to Modify

**These areas are generally safe for contributions:**

- **`/public/apps/`** - TAPP applications and libraries (won't break core system)
- **`/docs/`** - Documentation improvements are always welcome!
- **`/src/sys/gui/styles/`** - Visual enhancements and theme improvements
- **New GUI components in `/src/sys/gui/`** - As long as they don't break existing components
- **Bug fixes** - Anywhere, with proper testing

### 📋 Special Guidelines

- **Adding Terminal Commands**: See [Creating Terminal Commands](./creating-terminal-commands.md)
- **Creating Applications**: See [Creating Applications](./creating-apps.md)
- **Backend Configuration**: See [Backend Configuration](./backend-configuration.md)

## <a name="development-workflow" style="color: #32ae62;">Development Workflow</a>

### Branching Strategy

We use a simple branching model:

1. **`main`** - Production-ready code
2. **Feature branches** - Your contributions

### Making Changes

1. **Sync with upstream** before starting work:
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   ```

2. **Create a feature branch** with a descriptive name:
   ```bash
   git checkout -b feature/add-dark-theme
   git checkout -b fix/file-manager-crash
   git checkout -b docs/improve-api-reference
   ```

3. **Make your changes** following our code style guidelines

4. **Test your changes** thoroughly:
   ```bash
   pnpm dev    # Test locally
   pnpm build  # Ensure it builds
   ```

5. **Commit your changes** with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add dark theme support to file manager"
   ```

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add new feature` - New features
- `fix: resolve bug in file picker` - Bug fixes
- `docs: update API documentation` - Documentation changes
- `style: format code with prettier` - Code style changes
- `refactor: reorganize window manager code` - Code refactoring
- `test: add tests for dialog API` - Adding tests
- `chore: update dependencies` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add context menu to desktop icons"
git commit -m "fix: resolve memory leak in window manager"
git commit -m "docs: clarify MASQR configuration options"
git commit -m "refactor: simplify notification API"
```

## <a name="pull-request-guidelines" style="color: #32ae62;">Pull Request Guidelines</a>

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation is updated (if needed)
- [ ] Commits follow the commit message format
- [ ] Branch is up to date with `main`
- [ ] No merge conflicts

### Creating a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/add-dark-theme
   ```

2. **Open a Pull Request** on GitHub

3. **Fill out the PR template** with:
   - Clear description of changes
   - Motivation and context
   - Related issue numbers (if applicable)
   - Screenshots/videos (for UI changes)
   - Testing instructions

### PR Review Process

- PRs are reviewed by maintainers
- Address review feedback promptly
- Keep discussions respectful and constructive
- Be patient - reviews may take a few days

### After PR is Merged

1. **Delete your branch** (optional but recommended):
   ```bash
   git branch -d feature/add-dark-theme
   git push origin --delete feature/add-dark-theme
   ```

2. **Sync your fork** with upstream:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

## <a name="code-style-guidelines" style="color: #32ae62;">Code Style Guidelines</a>

### TypeScript/JavaScript

- Use **TypeScript** for new code
- Use **functional components** with hooks (React)
- Use **async/await** instead of promises chains
- Use **meaningful variable names**
- Add **comments** for complex logic
- Follow **ESLint rules** (if configured)

**Good:**
```typescript
const handleFileOpen = async (filePath: string) => {
    try {
        const content = await tb.fs.promises.readFile(filePath, 'utf8');
        setFileContent(content);
    } catch (error) {
        console.error('Failed to open file:', error);
        tb.dialog.Alert({ title: 'Error', message: 'Could not open file' });
    }
};
```

**Bad:**
```javascript
function a(b) {
    tb.fs.promises.readFile(b, 'utf8').then(c => d(c)).catch(e => console.log(e));
}
```

### CSS/Styling

- Use **CSS modules** or **scoped styles** when possible
- Follow existing naming conventions
- Use **CSS variables** for theming
- Keep styles organized and commented

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `FileManager.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Styles**: `ComponentName.module.css`
- **Constants**: `UPPER_SNAKE_CASE` for file names with constants

## <a name="testing" style="color: #32ae62;">Testing</a>

### Manual Testing

Before submitting, test your changes:

1. **Functional testing** - Does it work as expected?
2. **Edge cases** - What happens with invalid input?
3. **Browser testing** - Test in Chrome, Firefox, Safari
4. **Regression testing** - Did you break anything else?

### Testing Checklist for UI Changes

- [ ] Responsive design works on different screen sizes
- [ ] Keyboard navigation works
- [ ] Colors work in light/dark themes (if applicable)
- [ ] No console errors or warnings
- [ ] Performance is acceptable

## <a name="reporting-bugs" style="color: #32ae62;">Reporting Bugs</a>

Found a bug? Please report it on [GitHub Issues](https://github.com/TerbiumOS/terbium/issues).

### Bug Report Template

**Title**: Clear, descriptive title

**Description**:
- What happened?
- What did you expect to happen?
- Steps to reproduce
- Screenshots/videos (if applicable)

**Environment**:
- Terbium version
- Browser and version
- Operating system

**Example:**
```markdown
### Bug: File Manager crashes when opening large files

**Description:**
When I try to open a file larger than 10MB in the File Manager, 
the application crashes without any error message.

**Steps to Reproduce:**
1. Open File Manager
2. Navigate to a file larger than 10MB
3. Double-click to open
4. Application crashes

**Expected:** File should open or show an error message

**Environment:**
- Terbium v2.4.0
- Chrome 120.0
- Windows 11

**Screenshot:** [attached]
```

## <a name="feature-requests" style="color: #32ae62;">Feature Requests</a>

Have an idea? Open a [Feature Request](https://github.com/TerbiumOS/terbium/issues) on GitHub!

### Feature Request Template

**Title**: Clear feature description

**Problem**: What problem does this solve?

**Proposed Solution**: How would you implement this?

**Alternatives**: Other solutions you considered?

**Additional Context**: Any other relevant information

## <span style="color: #32ae62;">Questions?</span>

- Check existing documentation in `/docs/`
- Search [GitHub Issues](https://github.com/TerbiumOS/terbium/issues)
- Ask in discussions (if available)

## <span style="color: #32ae62;">License</span>

By contributing to Terbium v2, you agree that your contributions will be licensed under the project's existing license.

---

**Thank you for contributing to Terbium v2! 🎉**
