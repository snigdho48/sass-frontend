# SaaS Platform Frontend

A modern React application with Tailwind CSS for the SaaS technical data logging and analytics platform.

## Features

- 🎨 Modern UI with Tailwind CSS
- 📊 Interactive charts and analytics
- 🔐 Authentication system
- 📱 Responsive design
- ⚡ Fast and optimized
- 🎯 Role-based access control
- 📈 Real-time data visualization
- 📄 PDF report generation

## Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching
- **Recharts** - Charts and graphs
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hook Form** - Form handling

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend Django server running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

4. Start development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API services
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── utils/         # Utility functions
└── index.css      # Global styles
```

## Features Overview

### Authentication
- Login/Register forms
- JWT token management
- Protected routes
- User profile management

### Dashboard
- Analytics overview
- Interactive charts
- Real-time metrics
- Recent activity feed

### Data Entry
- Category selection
- Form validation
- Data management
- CRUD operations

### Reports
- Report generation
- PDF download
- Custom date ranges
- Multiple report types

## API Integration

The frontend communicates with the Django backend through RESTful APIs:

- Authentication endpoints
- Data management
- Analytics and reporting
- User management

## Deployment

### Production Build

1. Build the application:
```bash
npm run build
```

2. Serve the build folder with a web server (nginx, Apache, etc.)

### Environment Variables

Configure these environment variables for production:

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_ENVIRONMENT` - Environment (production/development)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 