# Build Notes

## Known Issues

### Google Fonts Build Error

During build, Next.js attempts to fetch fonts from Google Fonts. In restricted network environments, this may fail with:

```
Failed to fetch `Geist Mono` from Google Fonts.
Failed to fetch `Inter` from Google Fonts.
```

**Solutions:**

1. **For Production Builds:** Deploy to Vercel, Netlify, or other platforms with internet access. The build will succeed there.

2. **For Local Development:** Just run `npm run dev` - fonts will be loaded at runtime from the user's browser, not at build time.

3. **For Restricted Environments:** You can modify `app/layout.tsx` to use local fonts or system fonts instead of Google Fonts.

### React-is Dependency

If you get an error about missing `react-is`, install it with:

```bash
npm install react-is --legacy-peer-deps
```

This has already been added to the package.json.

## Installation

Always use `--legacy-peer-deps` when installing with npm:

```bash
npm install --legacy-peer-deps
```

Or use pnpm which handles peer dependencies better:

```bash
pnpm install
```

## Development

For development, no build is required:

```bash
npm run dev
```

This will start the development server at http://localhost:3000
