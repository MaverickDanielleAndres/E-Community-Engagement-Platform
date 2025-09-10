# E-Community Platform

A modern, secure community engagement platform built with Next.js 14, designed for barangays, condominiums, schools, and businesses to facilitate transparent democratic decision-making.

## 🚀 Features

- **🗳️ Voting & Surveys**: Create secure polls with deadlines, live results, and anomaly detection
- **📢 Complaint Center**: Submit issues, attach photos, and track resolution status
- **📊 Feedback & Sentiment**: Collect feedback and visualize community sentiment trends
- **👥 Community Management**: Manage residents, roles, and permissions
- **🔒 Security & Privacy**: End-to-end encryption, audit logs, and GDPR compliance
- **🤖 AI Insights**: Smart analytics and recommendations powered by machine learning

## 🛠️ Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for micro-interactions
- **Authentication**: NextAuth.js with JWT + Google/Facebook OAuth
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend for transactional emails
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
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Console
   - `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET`: From Facebook Developers
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: From your Supabase project
   - `RESEND_API_KEY`: From Resend dashboard

4. **Set up the database**
   
   Create the following table in your Supabase database:
   
   ```sql
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255),
     full_name VARCHAR(255) NOT NULL,
     role VARCHAR(50) DEFAULT 'Resident' CHECK (role IN ('Resident', 'Admin', 'Guest')),
     community_code VARCHAR(100),
     email_verified BOOLEAN DEFAULT FALSE,
     verification_token VARCHAR(255),
     oauth_provider VARCHAR(50),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create RLS policies
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;

   -- Allow users to read their own data
   CREATE POLICY "Users can view own profile" ON users
     FOR SELECT USING (auth.uid()::text = id::text);

   -- Allow users to update their own data
   CREATE POLICY "Users can update own profile" ON users
     FOR UPDATE USING (auth.uid()::text = id::text);
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

### Colors
- **Primary**: Emerald (500) to Sky (500) gradient
- **Light Theme**: White backgrounds, Slate text
- **Dark Theme**: Slate (900) backgrounds, Slate (100) text

### Typography
- **Font**: Inter (system fallback)
- **Weights**: 400 (body), 600 (headings)
- **Scale**: 14px (sm), 16px (base), 20px (lg)

### Components
- **Buttons**: Rounded (2xl), gradient backgrounds, hover animations
- **Inputs**: Floating labels, focus states, validation
- **Cards**: Rounded (2xl), subtle shadows, hover effects

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Navigation**: Hamburger menu on mobile, full nav on desktop
- **Forms**: Stack on mobile, side-by-side on larger screens

## 🔐 Authentication

### Supported Methods
- **Email/Password**: Secure credential-based authentication
- **Google OAuth**: Single sign-on with Google accounts
- **Facebook OAuth**: Single sign-on with Facebook accounts

### Security Features
- **Password Requirements**: Min 8 chars, numbers, symbols
- **JWT Tokens**: 15-minute expiry for enhanced security
- **Rate Limiting**: Protection against brute force attacks
- **Email Verification**: Required for new accounts

## 📧 Email Templates

### Verification Email
- **Design**: Branded HTML template with gradient header
- **Content**: Welcome message with verification link
- **Security**: 24-hour token expiry

### Contact Form
- **Admin Notification**: Formatted submission details
- **User Confirmation**: Thank you message with response time

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect your repository** to Vercel
2. **Add environment variables** in project settings
3. **Deploy** - automatic deployments on git push

### Environment Variables for Production
```bash
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
# ... other variables
```

## 📊 Performance

### Optimization Features
- **Next.js Image Optimization**: Automatic WebP conversion
- **Font Optimization**: Variable fonts with display swap
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Pre-rendered pages where possible

### Target Metrics
- **Lighthouse Performance**: >90
- **First Contentful Paint**: <2s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1

## 🧪 Testing

### Setup (Coming Soon)
```bash
# Unit tests with Jest
npm run test

# E2E tests with Playwright
npm run test:e2e

# Accessibility audit
npm run test:a11y
```

## 🛡️ Security

### Best Practices
- **HTTPS Only**: Secure connections in production
- **CSRF Protection**: Built-in NextAuth protection
- **XSS Prevention**: Sanitized inputs and outputs
- **Rate Limiting**: API endpoint protection
- **Audit Logs**: Track all user actions

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- **Code Style**: ESLint + Prettier configuration
- **Commit Messages**: Conventional commits format
- **Testing**: Write tests for new features
- **Documentation**: Update README for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Maverick Danielle**
- Email: maverickdanielle@gmail.com
- Location: Las Piñas, Metro Manila, PH

## 🙏 Acknowledgments

- **Next.js Team** for the incredible framework
- **Vercel** for seamless deployment
- **Tailwind CSS** for the utility-first styling
- **Supabase** for the backend infrastructure
- **Community** for feedback and support

## 📞 Support

For support, email maverickdanielle@gmail.com or create an issue in this repository.

---

Made with ❤️ for stronger communities