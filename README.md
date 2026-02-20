# Gallery Selector Config

A powerful userscript for selecting and copying gallery image links with customizable CSS selectors.

## Features

- **Custom CSS Selectors**: Configure card, link, and container selectors to match any gallery layout
- **Preset Sites Support**: Load pre-configured selectors from a centralized API
- **Selection Mode**: Click cards to select/deselect them with visual feedback
- **Bulk Copy**: Copy all links or only selected ones to clipboard
- **Test Configuration**: Validate your selectors before applying
- **Lazy-load Support**: Automatically detects and handles dynamically loaded content
- **Smart Selector Handling**: Automatically handles complex CSS selectors including combinators

## Installation

### Prerequisites

- Install a userscript manager:
  - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
  - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
  - [Greasemonkey](https://www.greasespot.net/) (Firefox)

### Setup

1. **Get Your API Key**
   - Visit the [Gallery Security Selectors Panel](https://github.com/ali934h/Gallery-Security-Selectors)
   - Follow the instructions to set up your own panel and obtain an API key

2. **Install the Script**
   - Open `gallery-selector.user.js` from this repository
   - Click "Raw" to view the raw script
   - Your userscript manager should prompt you to install it

3. **Configure API Key**
   - Edit the installed script in your userscript manager
   - Replace `YOUR_API_KEY` with your actual API key:
   ```javascript
   const API_KEY = 'gss_YOUR_ACTUAL_KEY_HERE';
   ```

## Usage

### Quick Start

1. Navigate to any website with image galleries
2. A configuration panel will appear in the top-right corner
3. Use preset sites (if available) or configure custom selectors
4. Click "Apply" to save your configuration
5. Click "☑ Select" to enter selection mode
6. Click on gallery items to select them
7. Click "⧉ Copy Links" to copy selected links (or all links if none selected)

### Configuration Options

#### Preset Sites
Select from a dropdown of pre-configured sites with optimized selectors.

#### Custom Selectors

- **Card Selector**: CSS selector for individual gallery items
  - Example: `ul.gallery li`, `div.photo-card`

- **Link Selector**: CSS selector for the link inside each card
  - Example: `a[href]`, `figure > a`, `>a.photo-link`
  - Supports advanced combinators (`>`, `+`, `~`)
  - Script automatically adds `:scope` prefix when needed

- **Container Selector**: CSS selector for the gallery container (for lazy-load detection)
  - Example: `ul.gallery`, `div.photo-grid`

#### Test Configuration
Click "Test Config" to validate your selectors before applying them. It will show:
- Number of cards found
- Number of cards with valid links

## Advanced Features

### Smart Combinator Handling

The script automatically handles CSS combinators that start selectors:

```javascript
// Input: '>a.photo-link'
// Automatically converted to: ':scope >a.photo-link'
```

This allows you to use child combinators (`>`) at the beginning of link selectors.

### Selection Mode

- **Toggle**: Click anywhere on a card to select/deselect
- **Visual Feedback**: Selected cards show a cyan outline
- **Navigation Block**: Prevents accidental navigation while in selection mode
- **Checkbox Override**: Clicking the checkbox directly also works

### Copy Behavior

- If **no cards are selected**: Copies all available links
- If **cards are selected**: Copies only selected links
- Links are separated by newlines for easy pasting

## API Integration

The script fetches preset configurations from:
```
https://gallery-security-selectors.pages.dev/public-api/sites
```

Expected API response format:
```json
{
  "success": true,
  "count": 3,
  "sites": [
    {
      "site": "example.com",
      "cardSelector": "li.photo-item",
      "linkSelector": "a[href]",
      "containerSelector": "ul.photo-list"
    }
  ]
}
```

For more information on setting up your own API, see [Gallery Security Selectors](https://github.com/ali934h/Gallery-Security-Selectors).

## Troubleshooting

### "Failed to execute querySelector" Error

- Make sure your selector doesn't start with a combinator without `:scope`
- Use simple selectors for Card Selector (avoid complex combinators)
- Link Selector combinators are automatically handled

### No Links Found

- Click "Test Config" to verify your selectors
- Check browser console for errors
- Ensure the page has fully loaded before testing

### Presets Not Loading

- Verify your API key is correctly set
- Check browser console for network errors
- Ensure you have internet connectivity

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Related Projects

- [Gallery Security Selectors](https://github.com/ali934h/Gallery-Security-Selectors) - API panel for managing site configurations

## Author

Created by [ali934h](https://github.com/ali934h)

---

**Note**: This tool is designed for personal use and educational purposes. Always respect website terms of service and copyright laws.