import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { createCanvas, loadImage, registerFont } from 'canvas';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create necessary directories
const ensureDirectories = () => {
  const dirs = ['uploads', 'generated', 'assets'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

ensureDirectories();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed!'), false);
    }
  }
});

// Email transporter
const createTransporter = () => {
  if (!process.env.EMAIL || !process.env.APP_PASSWORD) {
    throw new Error('Email credentials not configured');
  }
  
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD
    }
  });
};

// Generate personalized image
const generatePersonalizedImage = async (templatePath, data, outputPath) => {
  try {
    const templateImage = await loadImage(templatePath);
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext('2d');

    // Draw template image
    ctx.drawImage(templateImage, 0, 0);

    // Set text properties
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Arial';

    // Position text overlay (adjust coordinates based on template)
    const centerX = canvas.width / 2;
    const nameY = canvas.height - 250;
    const phoneY = canvas.height - 200;
    const emailY = canvas.height - 150;

    // Draw text with outline for better visibility
    ctx.strokeText(data.name, centerX, nameY);
    ctx.fillText(data.name, centerX, nameY);

    ctx.font = 'bold 28px Arial';
    ctx.strokeText(`Phone: ${data.phone}`, centerX, phoneY);
    ctx.fillText(`Phone: ${data.phone}`, centerX, phoneY);

    ctx.font = 'bold 24px Arial';
    ctx.strokeText(`Email: ${data.email}`, centerX, emailY);
    ctx.fillText(`Email: ${data.email}`, centerX, emailY);

    // Save the generated image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

// Send email with attachment
const sendEmail = async (transporter, recipient, imagePath) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: recipient.email,
    subject: 'Your Personalized Investment Card',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Your Personalized Investment Card</h2>
        <p>Dear ${recipient.name},</p>
        <p>Thank you for your interest in our Systematic Investment Plan. Please find your personalized investment card attached.</p>
        <p>This card contains your contact information and highlights the key benefits of our investment approach.</p>
        <p>For any questions or to start your investment journey, please contact us using the details provided on your card.</p>
        <p>Best regards,<br>Investment Team</p>
      </div>
    `,
    attachments: [
      {
        filename: `investment-card-${recipient.name.replace(/\s+/g, '-')}.png`,
        path: imagePath
      }
    ]
  };

  return transporter.sendMail(mailOptions);
};

// Process Excel file and generate emails
const processExcelFile = async (filePath, ws) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    const templatePath = path.join(__dirname, 'assets', 'template.png');
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template image not found');
    }

    const transporter = createTransporter();
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      errors: []
    };

    // Skip header row, start from row 2
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const name = row.getCell(1).value?.toString().trim();
        const phone = row.getCell(2).value?.toString().trim();
        const email = row.getCell(3).value?.toString().trim();

        if (name && phone && email) {
          rows.push({ name, phone, email });
        }
      }
    });

    results.total = rows.length;

    // Send initial status
    ws.send(JSON.stringify({
      type: 'progress',
      data: { ...results, processing: true }
    }));

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Generate personalized image
        const outputPath = path.join(__dirname, 'generated', `card-${i + 1}.png`);
        await generatePersonalizedImage(templatePath, row, outputPath);

        // Send email
        await sendEmail(transporter, row, outputPath);

        results.success++;
        
        // Clean up generated image
        fs.unlinkSync(outputPath);

        // Send progress update
        ws.send(JSON.stringify({
          type: 'progress',
          data: { ...results, processing: true, currentIndex: i + 1 }
        }));

      } catch (error) {
        results.failed++;
        results.errors.push(`${row.name}: ${error.message}`);
        
        console.error(`Error processing ${row.name}:`, error);
      }
    }

    // Send final results
    ws.send(JSON.stringify({
      type: 'complete',
      data: { ...results, processing: false }
    }));

    return results;

  } catch (error) {
    console.error('Error processing Excel file:', error);
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: error.message }
    }));
    throw error;
  }
};

// Routes
app.post('/api/upload', upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return upload success - processing will be handled via WebSocket
    res.json({ 
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: req.file.path
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/process', async (req, res) => {
  try {
    const { filename } = req.body;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Start processing (this would be handled via WebSocket in real implementation)
    res.json({ message: 'Processing started' });

  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL && process.env.APP_PASSWORD)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Email configured:', !!(process.env.EMAIL && process.env.APP_PASSWORD));
});