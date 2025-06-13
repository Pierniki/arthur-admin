# Arthur GenAI Admin Interface

A modern web interface for monitoring and analyzing Arthur GenAI inference data. Built with the [T3 Stack](https://create.t3.gg/) for a robust, type-safe development experience.

## Features

- 🔐 **Secure API Key Management** - Enter your Arthur API key securely (stored in memory only)
- 📊 **Inference Monitoring** - View and analyze your Arthur GenAI inference data
- 🔍 **Advanced Filtering** - Filter by task name, user ID, date ranges, and rule statuses
- 📈 **Real-time Data** - Live updates of inference results and rule violations
- 🎯 **Rule Analysis** - Detailed breakdown of rule results with expandable details
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Prerequisites

- Node.js 18+
- An Arthur GenAI API endpoint
- A valid Arthur GenAI API key

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd engine-admin
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   ARTHUR_BASE_URL=https://your-arthur-api-endpoint.com
   ```

   Note: You do NOT need to set `ARTHUR_API_KEY` in environment variables. The app will prompt you to enter it securely when you access the interface.

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open the application**
   Visit [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Navigate to the inferences page** by clicking "View Inferences" from the homepage
2. **Enter your Arthur API key** when prompted - this will be validated against your Arthur API
3. **Explore your inference data** using the comprehensive filtering and analysis tools
4. **Use the disconnect button** to change API keys or secure your session

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Security

- API keys are never stored in localStorage or environment variables
- All API communication is handled server-side through Next.js API routes
- Connection validation ensures only valid API keys can access data
