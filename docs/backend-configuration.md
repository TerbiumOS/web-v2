# <span style="color: #32ae62;">Backend Configuration Options</span>

**Last Updated**: v2.4.0 - 07/16/2026

Terbium's backend is highly configurable through the `.env` file located in the root directory of your Terbium installation. If the `.env` file doesn't exist when you first run Terbium, an interactive setup wizard will guide you through creating it.

## <span style="color: #32ae62;">Environment File Structure</span>

The `.env` file should be placed in the root directory of your Terbium installation. Here's a complete example:

```env
# MASQR Configuration (Anti Link Leaking System)
MASQR=false
LICENSE_SERVER_URL=https://masqr-license-server.example.com
WHITELISTED_DOMAINS=localhost,127.0.0.1,example.com

# Server Configuration
PORT=3000
WISP_PORT=6001
```

## <span style="color: #32ae62;">Configuration Options Explained</span>

### MASQR Settings

[MASQR (Managed Application Security Query Router)](https://github.com/titaniumnetwork-dev/masqr-project) is an anti-link leaking system that helps protect user privacy by preventing direct connections to external services.

#### `MASQR`
- **Type**: Boolean (`true` or `false`)
- **Default**: `false`
- **Description**: Enables or disables the MASQR anti-link leaking system
- **Example**: `MASQR=true`

**When to enable**: Enable MASQR if you want to prevent direct connection leaks to external services. This is particularly useful for:
- Educational environments where network monitoring is a concern
- Privacy-focused deployments
- Environments with strict network policies

#### `LICENSE_SERVER_URL`
- **Type**: URL string
- **Default**: (None - required if MASQR is enabled)
- **Description**: The URL of the MASQR license server where keys are validated
- **Example**: `LICENSE_SERVER_URL=https://masqr.example.com`

**Note**: This setting is only required when `MASQR=true`. If MASQR is disabled, you can leave this blank or omit it entirely.

#### `WHITELISTED_DOMAINS`
- **Type**: Comma-separated list of domains
- **Default**: (None)
- **Description**: Domains that MASQR will bypass (not apply protection to)
- **Example**: `WHITELISTED_DOMAINS=localhost,127.0.0.1,api.example.com`

**Common whitelist entries**:
- `localhost` - Local development
- `127.0.0.1` - Local loopback
- Your own domain names that don't need protection
- Trusted API endpoints

### Server Settings

#### `PORT`
- **Type**: Integer
- **Default**: `3000`
- **Description**: The port number the Terbium backend server will listen on
- **Example**: `PORT=8080`

#### `WISP_PORT`
- **Type**: Integer
- **Default**: `6001`
- **Description**: The port number where the Wisp WebSocket server runs
- **Example**: `WISP_PORT=6001`

**What is Wisp?**: Wisp is a protocol for proxying network connections through WebSockets. Terbium uses WispJS to enable network access for applications. The Wisp WebSocket server runs on the configured port and handles all proxy connections.

**Note**: The Wisp endpoint path is hardcoded to `/wisp/` in the server and cannot be changed via environment variables.

**DNS Servers**: By default, all Terbium instances use Cloudflare's malware-blocking DNS servers:
- Primary: `1.1.1.3`
- Secondary: `1.0.0.3`

These DNS servers provide basic malware protection while maintaining good performance.

## <span style="color: #32ae62;">Example Configurations</span>

### Basic Development Setup

```env
# Minimal configuration for local development
MASQR=false
PORT=3000
WISP_PORT=6001
```

### Production with MASQR

```env
# Production setup with MASQR enabled
MASQR=true
LICENSE_SERVER_URL=https://masqr-license.example.com
WHITELISTED_DOMAINS=localhost,127.0.0.1,cdn.example.com
PORT=80
WISP_PORT=6001
```

### Educational Institution Setup

```env
# Configuration for school/institutional use
MASQR=true
LICENSE_SERVER_URL=https://school-masqr.example.edu
WHITELISTED_DOMAINS=localhost,internal.school.edu
PORT=8080
WISP_PORT=6001
```

## <span style="color: #32ae62;">Troubleshooting</span>

### Common Issues

**Issue**: Server won't start after changing `.env`
- **Solution**: Restart the Terbium backend server completely. Changes to `.env` require a server restart to take effect.

**Issue**: MASQR not working
- **Solutions**:
  - Verify `MASQR=true` (not "True" or "TRUE")
  - Check that `LICENSE_SERVER_URL` is accessible
  - Ensure your MASQR license is valid
  - Check server logs for MASQR-related errors

**Issue**: Port already in use
- **Solution**: Change the `PORT` value to an unused port (e.g., `3001`, `8080`)

**Issue**: Applications can't connect to external services
- **Solutions**:
  - Verify Wisp is configured correctly
  - Check that the Wisp endpoint is accessible at the configured path
  - Review DNS server connectivity (1.1.1.3 and 1.0.0.3 should be reachable)

## <span style="color: #32ae62;">Security Best Practices</span>

1. **Never commit `.env` to version control**: Add `.env` to your `.gitignore` file
2. **Use MASQR in monitored environments**: Enable MASQR when deploying to networks where traffic monitoring is a concern
3. **Restrict whitelisted domains**: Only whitelist domains you trust and control
4. **Use HTTPS in production**: When deploying publicly, always use HTTPS with valid certificates
5. **Keep license servers private**: Don't expose MASQR license server URLs publicly if possible

## <span style="color: #32ae62;">Need Help?</span>

If you encounter issues not covered here:
- Check the [GitHub Issues](https://github.com/TerbiumOS/terbium/issues)
- Review server logs for error messages
- Consult the [MASQR documentation](https://github.com/titaniumnetwork-dev/masqr-project) for MASQR-specific issues
