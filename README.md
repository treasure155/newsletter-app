```markdown
Newsletter Pro

Newsletter Pro is a Node.js-based web application for managing email subscriptions, sending newsletters, and scheduling email campaigns. Admins can create and send emails to subscribers, manage subscribers, and export subscriber lists in PDF or Excel formats. The platform also supports scheduling emails and creating email templates for future use.

Features

- Subscriber Management: Add, delete, and manage subscriber lists.
- Export Data: Export subscriber data to PDF and Excel formats.
- Email Template Management: Create and manage reusable email templates.
- Scheduled Emails: Set up email campaigns and schedule them for later delivery.
- Subscriber Lists: Assign subscribers to specific lists for targeted newsletters.
- Admin Dashboard: Centralized dashboard for managing subscribers, email templates, and campaigns.

Technologies Used

- Node.js: Backend framework
- Express.js: Web framework for Node.js
- MongoDB: Database to store subscriber data
- Mongoose: ORM for MongoDB
- EJS: Templating engine for rendering views
- Nodemailer: Email sending service
- Node-Schedule: Library to schedule emails
- XLSX: Library for handling Excel files
- PDFKit: Library for generating PDFs

Installation

Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [MongoDB](https://www.mongodb.com/try/download/community) (or use MongoDB Atlas for cloud-hosted MongoDB)

Clone the repository

```bash
git clone https://github.com/your-username/newsletter-pro.git
cd newsletter-pro
```

Install dependencies

```bash
npm install
```

Environment Variables

Create a `.env` file in the root directory with the following environment variables:

```plaintext
MONGO_URI=your-mongodb-connection-string
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=your-smtp-port
SMTP_USER=your-email-username
SMTP_PASS=your-email-password
```

Run the application

```bash
npm start
```

The application should now be running on `http://localhost:3000`.

Usage

Admin Dashboard

1. Manage Subscribers**: From the dashboard, you can add new subscribers by providing their name, email, and phone number.
2. Export Subscribers**: Export subscriber data in PDF or Excel format.
3. Create Email Templates**: Create email templates that can be reused for newsletters.
4. Schedule Emails**: Set up email campaigns and choose a time to send them automatically.
5. Send Newsletters**: Send email campaigns directly to a selected list of subscribers.

API Endpoints

- `POST /admin/add-subscriber`: Add a new subscriber.
- `POST /admin/delete-subscriber`: Delete an existing subscriber.
- `POST /admin/add-template`: Create a new email template.
- `POST /admin/schedule-email`: Schedule an email campaign.
- `GET /admin/export-excel`: Export subscriber list as Excel.
- `GET /admin/export-pdf`: Export subscriber list as PDF.

License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## Contact

For any inquiries or issues, please reach out at:
- Email: admin@techalphahub.com
- Phone: +2347066155981, +2348130790321
- Website: [TechAlpha Hub](https://www.techalphahub.com)

---

© 2024 TechAlpha Hub. All rights reserved.
```
