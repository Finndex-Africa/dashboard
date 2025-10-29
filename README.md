# Finndex Dashboard

The authenticated portal for Finndex Africa's property management platform.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── profile/
│   │   └── settings/
│   ├── globals.css
│   └── layout.tsx
├── components/
├── services/
└── utils/
```

## Environment Variables

Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_API_URL=https://api.finndexafrica.com/api
NEXT_PUBLIC_AUTH_MODE=dashboard
```

## Features

- Authentication (login/register)
- Dashboard overview
- Property management
- User profile
- Settings management