# E-Community Platform

A modern, secure community engagement platform built with Next.js 14, designed for barangays, condominiums, schools, and businesses to facilitate transparent democratic decision-making.

## 🚀 Features

- **🗳️ Voting & Surveys**: Create secure polls with deadlines, live results, and anomaly detection to ensure fair participation
- **📢 Complaint Center**: Submit issues, attach photos, and track resolution status with full transparency
- **📊 Feedback & Sentiment Analysis**: Collect feedback, analyze sentiment trends, and visualize community insights
- **🤖 AI-Powered Features**:
  - AI Chat assistant for community queries
  - Sentiment analysis for feedback
  - Anomaly detection for polls
  - AI classification and insights
- **👥 Community Management**: Manage residents, roles, and permissions with granular access controls
- **🔒 Security & Privacy**: End-to-end encryption, audit logs, ID verification, and GDPR compliance
- **🌐 Guest Access**: Allow non-registered users to explore polls and complaints
- **📱 Responsive Design**: Optimized for mobile and desktop with dark/light theme support

## 🛠️ Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for micro-interactions
- **Authentication**: NextAuth.js with JWT + Google/Facebook OAuth
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend for transactional emails
- **AI Integration**: Custom AI services for chat, sentiment, and analytics
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/e-community-platform.git
   cd e-community-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```env
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_CLIENT_ID=your-facebook-client-id
   FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
   RESEND_API_KEY=your-resend-api-key
   ```

4. **Set up the database**
   Run the SQL migrations in the `migration/` and `sql/` directories to set up your Supabase database schema.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### For Residents
- Sign up and verify your account
- Submit complaints with photos
- Participate in community polls
- Provide feedback and view sentiment analysis
- Chat with AI assistant for community information

### For Admins
- Manage community members and roles
- Review and resolve complaints
- Create and monitor polls
- Access AI insights and analytics
- View audit logs and notifications

### For Guests
- Explore public polls and complaints
- Access community information
- Use AI chat for general queries

## 📊 Current Status

**Version**: 0.1.0

**Development Phase**: Implementation and Testing

The project is currently in active development with core features implemented and undergoing testing. Key components include:

- ✅ User authentication and role management
- ✅ Complaint submission and tracking
- ✅ Poll creation and voting
- ✅ Feedback collection with sentiment analysis
- ✅ AI chat and insights
- ✅ Guest access features
- ✅ ID verification system
- 🔄 Testing suite (Coming Soon)
- 🔄 Production deployment optimizations

## 🧪 Testing

Testing framework setup is planned for future releases. Currently undergoing manual testing and integration verification.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in project settings
3. Deploy automatically on git push

### Environment Variables for Production
```env
NEXTAUTH_URL=https://your-domain.com
# ... other production variables
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write descriptive commit messages
- Test your changes thoroughly

## 📄 License

This project is proprietary. Do not copy, distribute, or use without explicit permission from the author.

## 👨‍💻 Author

**Maverick Danielle**
- Email: maverickdanielle@gmail.com
- Location: Las Piñas, Metro Manila, PH

## 🙏 Acknowledgments

- Next.js Team for the incredible framework
- Vercel for seamless deployment
- Supabase for the backend infrastructure
- Tailwind CSS for the utility-first styling
- Community for feedback and support

## 📞 Support

For support, email maverickdanielle@gmail.com or create an issue in this repository.

---

Made with ❤️ for stronger communities
