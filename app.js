const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();
const multer = require('multer'); 
const XLSX = require('xlsx'); 
const csvParser = require('csv-parser'); 
const { Parser } = require('json2csv'); 
const PDFDocument = require('pdfkit'); 
const fs = require('fs');


const app = express();
const port = process.env.PORT || 9000;

mongoose.connect(process.env.MONGODB_URI);

const subscriberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
});

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Admin = mongoose.model('Admin', adminSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });


async function renderTemplate(templateName, data) {
  const templatePath = path.join(__dirname, 'views', `${templateName}.ejs`);
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, data, (err, html) => {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
}

app.get('/', (req, res) => {
  res.render('home');
});

app.post('/subscribe', async (req, res) => {
    const { name, email, phone } = req.body;
    try {
      const existingSubscriber = await Subscriber.findOne({ email });
      if (existingSubscriber) {
        return res.status(400).send('This email is already subscribed.');
      }
      await Subscriber.create({ name, email, phone });
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const htmlContent = await renderTemplate('email-template', {
        subscriberName: name,
        unsubscribeLink: `http://localhost:${port}/unsubscribe/${email}`,
      });
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Our Newsletter!',
        html: htmlContent,
      };
      await transporter.sendMail(mailOptions);
      res.redirect('/thank-you');
    } catch (error) {
      console.error('Error subscribing or sending welcome email:', error);
      res.status(500).send('Error subscribing. Please try again.');
    }
});

app.get('/thank-you', (req, res) => {
  res.render('thank-you');
});

app.get('/admin', (req, res) => {
  res.render('admin-login');
});

app.get('/admin-signup', (req, res) => {
  res.render('admin-signup');
});

app.post('/admin-signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match.');
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ username, password: hashedPassword });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error signing up. Please try again.');
  }
});

app.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (admin && await bcrypt.compare(password, admin.password)) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
    res.cookie('auth_token', token);
    res.redirect('/send-newsletter');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/send-newsletter', (req, res) => {
  const token = req.cookies.auth_token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err || decoded.role !== 'admin') {
        return res.status(403).send('Forbidden');
      }
      res.render('send-newsletter');
    });
  } else {
    res.redirect('/admin');
  }
});

app.post('/send-newsletter', async (req, res) => {
  const { subject, message } = req.body;
  const subscribers = await Subscriber.find();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  let sentCount = 0;
  try {
    for (const subscriber of subscribers) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: subscriber.email,
        subject: subject,
        text: message,
      };
      await transporter.sendMail(mailOptions);
      sentCount++;
    }
    console.log(`Newsletter sent to ${sentCount} subscribers`);
    res.redirect('/newsletter-sent');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending newsletter. Please try again.');
  }
});

app.get('/newsletter-sent', (req, res) => {
  res.render('newsletter-sent');
});

app.get('/admin/dashboard', async (req, res) => {
    const token = req.cookies.auth_token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err || decoded.role !== 'admin') {
          return res.status(403).send('Forbidden');
        }
        const subscribers = await Subscriber.find();
        res.render('admin-dashboard', { subscribers });
      });
    } else {
      res.redirect('/admin');
    }
});

app.post('/admin/delete-subscriber', async (req, res) => {
  const { email } = req.body;
  try {
    await Subscriber.deleteOne({ email });
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.status(500).send('Error deleting subscriber. Please try again.');
  }
});

app.post('/admin/add-subscriber', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).send('This email is already in the subscriber list.');
    }
    await Subscriber.create({ name, email, phone });
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error adding subscriber:', error);
    res.status(500).send('Error adding subscriber. Please try again.');
  }
});

app.get('/unsubscribe/:email', async (req, res) => {
  const { email } = req.params;
  try {
    await Subscriber.deleteOne({ email });
    res.send('You have successfully unsubscribed from our newsletter.');
  } catch (error) {
    res.status(500).send('Error unsubscribing. Please try again.');
  }
});

app.post('/send-template2', async (req, res) => {
  const subscribers = await Subscriber.find();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  let sentCount = 0;
  try {
    for (const subscriber of subscribers) {
      const htmlContent = await renderTemplate('email-template2', {
        subscriberName: subscriber.email,
        unsubscribeLink: 'http://example.com/unsubscribe',
      });
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: subscriber.email,
        subject: 'Special Announcement!',
        html: htmlContent,
      };
      await transporter.sendMail(mailOptions);
      sentCount++;
    }
    console.log(`Template 2 sent to ${sentCount} subscribers`);
    res.redirect('/newsletter-sent');
  } catch (error) {
    console.error('Error sending template 2:', error);
    res.status(500).send('Error sending template 2. Please try again.');
  }
});

app.get('/admin/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/');
});


app.post('/admin/import-subscribers', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        for (const row of sheetData) {
            const { name, email, phone } = row;
            const existingSubscriber = await Subscriber.findOne({ email });
            if (!existingSubscriber) {
                await Subscriber.create({ name, email, phone });
            }
        }
        fs.unlinkSync(file.path); // Remove the file after processing
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error importing subscribers:', error);
        res.status(500).send('Error importing subscribers. Please try again.');
    }
});

app.get('/admin/export-excel', async (req, res) => {
    try {
        const subscribers = await Subscriber.find();
        const subscriberData = subscribers.map(sub => ({
            Name: sub.name,
            Email: sub.email,
            Phone: sub.phone
        }));

        const worksheet = XLSX.utils.json_to_sheet(subscriberData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscribers');

        const exportDir = path.join(__dirname, 'exports');
        const exportPath = path.join(exportDir, 'subscribers.xlsx');

        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        XLSX.writeFile(workbook, exportPath);

        res.download(exportPath, 'subscribers.xlsx', (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
            fs.unlinkSync(exportPath); 
        });
    } catch (error) {
        console.error('Error exporting subscribers:', error);
        res.status(500).send('Error exporting to Excel.');
    }
});

app.get('/admin/export-csv', async (req, res) => {
    try {
        const subscribers = await Subscriber.find();
        const json2csvParser = new Parser({ fields: ['name', 'email', 'phone'] });
        const csvData = json2csvParser.parse(subscribers);

        const exportPath = './exports/subscribers.csv';
        fs.writeFileSync(exportPath, csvData);

        res.download(exportPath, 'subscribers.csv', (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
            fs.unlinkSync(exportPath);
        });
    } catch (error) {
        console.error('Error exporting subscribers:', error);
        res.status(500).send('Error exporting to CSV.');
    }
});

app.get('/admin/export-pdf', async (req, res) => {
    try {
        const subscribers = await Subscriber.find();
        const exportDir = path.join(__dirname, 'exports');
        const exportPath = path.join(exportDir, 'subscribers.pdf');

        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const doc = new PDFDocument();

        const writeStream = fs.createWriteStream(exportPath);
        doc.pipe(writeStream);

        doc.fontSize(16).text('Subscribers List', { align: 'center' });
        doc.moveDown();
        subscribers.forEach(sub => {
            doc.fontSize(12).text(`Name: ${sub.name}, Email: ${sub.email}, Phone: ${sub.phone}`);
            doc.moveDown();
        });

        doc.end();

        writeStream.on('finish', () => {
            res.download(exportPath, 'subscribers.pdf', (err) => {
                if (err) {
                    console.error('Error downloading PDF:', err);
                }
                fs.unlinkSync(exportPath);
            });
        });

        writeStream.on('error', (err) => {
            console.error('Error writing PDF:', err);
            res.status(500).send('Error exporting to PDF.');
        });

    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).send('Error exporting to PDF.');
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
