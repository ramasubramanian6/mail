# Personalized Bulk Email System

A full-stack application for automated personalized image generation and bulk email sending using Excel data.

## Features

- 📊 **Excel Upload**: Upload .xlsx files with Name, Phone, Email columns
- 🎨 **Image Generation**: Create personalized images using Canvas API
- 📧 **Bulk Email**: Send personalized emails with generated images
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ⚡ **Real-time Status**: Live progress tracking and status updates

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons

**Backend:**
- Node.js with Express
- Canvas API for image generation
- ExcelJS for Excel file parsing
- Nodemailer for email sending
- Multer for file uploads

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Configure Email Settings

1. Copy the example environment file:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Edit `.env` with your Gmail credentials:
   ```
   EMAIL=your-gmail@gmail.com
   APP_PASSWORD=your-app-password
   ```

3. **Generate Gmail App Password:**
   - Enable 2-factor authentication on your Gmail account
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Generate a new app password for "Mail"
   - Use this password in your `.env` file

### 3. Add Template Image

The template image is automatically copied from your upload. You can replace `server/assets/template.png` with your own template image.

### 4. Run the Application

```bash
# Start the backend server (from server directory)
cd server
npm run dev

# Start the frontend (from root directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Excel File Format

Your Excel file should contain these columns:

| Column A | Column B | Column C |
|----------|----------|----------|
| Name     | Phone    | Email    |
| John Doe | 9876543210 | john@example.com |
| Jane Smith | 9876543211 | jane@example.com |

## How It Works

1. **Upload**: Users upload an Excel file through the web interface
2. **Parse**: Backend parses the Excel file and extracts Name, Phone, Email data
3. **Generate**: For each record, a personalized image is generated using Canvas API
4. **Send**: Personalized emails are sent with the generated image attached
5. **Track**: Real-time status updates show progress and results

## Security Notes

- Store email credentials securely in environment variables
- Use Gmail App Passwords instead of regular passwords
- Validate file types and sizes on upload
- Clean up temporary files after processing

## Customization

### Image Template
- Replace `server/assets/template.png` with your own template
- Modify text positioning in `generatePersonalizedImage()` function
- Adjust font sizes, colors, and styles as needed

### Email Content
- Customize email subject and body in the `sendEmail()` function
- Add HTML templates for better email formatting
- Include additional attachments or content

### UI/UX
- Modify colors and styling in the React components
- Add additional status indicators or progress bars
- Implement drag-and-drop file upload enhancements

## Production Deployment

1. **Frontend**: Build and deploy to services like Vercel, Netlify
2. **Backend**: Deploy to services like Railway, Heroku, or DigitalOcean
3. **Environment**: Set production environment variables
4. **CORS**: Update CORS settings for your domain
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **Email Authentication Failed**
   - Ensure 2FA is enabled on Gmail
   - Use App Password, not regular password
   - Check email and password in .env file

2. **Image Generation Error**
   - Verify template image exists in `server/assets/`
   - Check Canvas dependencies are installed
   - Ensure sufficient system memory

3. **File Upload Issues**
   - Verify file is .xlsx format
   - Check file size limits in multer config
   - Ensure uploads directory exists

4. **Excel Parsing Error**
   - Verify Excel file has correct column structure
   - Check for empty rows or invalid data
   - Ensure proper column headers

## License

MIT License - feel free to use and modify as needed.