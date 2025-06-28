# justRizz: AI-Powered Instagram Dating Coach

## Overview
justRizz is an AI-powered Instagram DM coach that analyzes Instagram profiles and automatically generates and sends smart, funny, and personalized pickup lines as direct messages. It uses the Perplexity AI API for creative line generation and the instagrapi library for Instagram automation.

## Features
- Analyze any Instagram profile (public or private, if authenticated)
- Generate a personalized pickup line using Perplexity AI
- Automatically send the pickup line as a DM to the target user
- Ensures only the pickup line is sent (no preamble or explanation)
- Robust session management for Instagram login

## Setup

### 1. Clone the Repository
```bash
git clone <repo-url>
cd justRizz
```

### 2. Install Python Dependencies
```bash
cd instagram_dm_mcp
pip install -r requirements.txt
```

### 3. Install Node.js Dependencies (for frontend, if needed)
```bash
cd ..
npm install
```

### 4. Environment Variables
Create a `.env` file in the `instagram_dm_mcp` directory with the following:
```
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
PERPLEXITY_API_KEY=your_perplexity_api_key
```
- `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD`: Your Instagram credentials for automation (never share these).
- `PERPLEXITY_API_KEY`: Your API key from [Perplexity AI](https://docs.perplexity.ai/guides/getting-started).

### 5. Run the Backend Server
```bash
cd instagram_dm_mcp
python src/mcp_server.py --username $INSTAGRAM_USERNAME --password $INSTAGRAM_PASSWORD
```

### 6. Run the Frontend (if applicable)
```bash
npm run dev
```

## How It Works
1. The backend fetches the target user's Instagram profile info.
2. It sends the profile context to Perplexity AI with a prompt instructing the AI to ONLY return the pickup line (no preamble or explanation).
3. The system post-processes the AI's response to remove any generic phrases, ensuring only the pickup line is sent.
4. The pickup line is sent as a DM to the target user using the authenticated Instagram session.
5. The API response includes both the generated pickup line and the DM send status.

## Prompt Engineering
- The system prompt to Perplexity AI is:
  > You are an AI dating coach. Generate a smart, funny, and personalized pickup line using the provided Instagram profile details. IMPORTANT: ONLY return the pickup line itself. Do NOT include any preamble, explanation, or extra text.
- This ensures the AI's output is always direct and ready to send.

## Troubleshooting
- **Perplexity API 400 Error:** Ensure your API key is valid and the payload matches the [official docs](https://docs.perplexity.ai/guides/getting-started).
- **Instagram Login Issues:** Make sure your credentials are correct and not subject to 2FA or suspicious login blocks.
- **DM Not Sent:** The target user may not accept DMs from your account, or Instagram may rate-limit/bot-detect.

## Security
- Never share your `.env` file or credentials.
- API keys and passwords should be kept secret and out of version control.

## License
See [LICENSE](./instagram_dm_mcp/LICENSE).

## Credits
- [Perplexity AI](https://docs.perplexity.ai/)
- [instagrapi](https://github.com/adw0rd/instagrapi)
