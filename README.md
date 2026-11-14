\# CampusFind – Campus Lost \& Found Management System



CampusFind is a web-based Campus Lost \& Found Management System designed to help students report, discover, claim, and recover lost belongings within a university campus.



The platform provides a centralized place for students to publish lost and found item reports, browse listings, submit ownership claims, and track claim progress. It also includes an administrative dashboard for managing users, items, and claims.



\## Project Information



| Detail | Description |

|---|---|

| Project Name | CampusFind |

| Project Type | Individual Academic Project |

| Developer | Dibyaprotim Borah |

| Institution | Assam down town University (ADTU) |

| Programme | B.Tech – Computer Science and Engineering |

| Semester | 3rd Semester |

| Development Duration | Approximately 2 weeks |



\## Features



\### Student Features

\- Student registration and login.

\- Secure authentication using JSON Web Tokens (JWT).

\- Report lost and found items.

\- Upload images of reported items.

\- Browse available item listings.

\- Search and filter item listings.

\- View individual item details.

\- Submit claims for lost belongings.

\- Track submitted claims.

\- View claims received on reported items.



\### Admin Features

\- Dedicated administrative dashboard.

\- View dashboard statistics.

\- Manage registered users.

\- Manage reported items.

\- View submitted claims.

\- Approve or reject pending claims.

\- Monitor item and claim information.



\### Security and Validation

\- Password hashing using bcryptjs.

\- JWT-protected API routes.

\- Role-based administrative authorization.

\- Request and input validation.

\- API rate limiting.

\- Secure HTTP headers using Helmet.

\- Image validation and processing.

\- Protected administrative operations.



\## Technology Stack



\*\*Frontend\*\*

\- HTML5

\- CSS3

\- JavaScript



\*\*Backend\*\*

\- Node.js

\- Express.js



\*\*Database\*\*

\- MongoDB

\- Mongoose



\*\*Libraries\*\*

\- JSON Web Token (JWT)

\- bcryptjs

\- Multer

\- Sharp

\- express-validator

\- Helmet

\- express-rate-limit



\## Project Structure



```text

CampusFind/

├── backend/

│   ├── config/

│   │   └── db.js

│   ├── controllers/

│   │   ├── adminController.js

│   │   ├── authController.js

│   │   ├── claimController.js

│   │   └── itemController.js

│   ├── middleware/

│   │   ├── adminMiddleware.js

│   │   ├── authMiddleware.js

│   │   ├── processImage.js

│   │   ├── upload.js

│   │   └── validateRequest.js

│   ├── models/

│   │   ├── Claim.js

│   │   ├── Item.js

│   │   └── User.js

│   ├── routes/

│   │   ├── adminRoutes.js

│   │   ├── authRoutes.js

│   │   ├── claimRoutes.js

│   │   └── itemRoutes.js

│   ├── uploads/

│   ├── .env.example

│   ├── package.json

│   ├── package-lock.json

│   └── server.js

│

├── frontend/

│   ├── css/

│   │   ├── genz-theme.css

│   │   └── style.css

│   ├── js/

│   │   ├── admin.js

│   │   ├── app.js

│   │   ├── auth.js

│   │   ├── claims-received.js

│   │   ├── claims.js

│   │   ├── config.js

│   │   ├── items.js

│   │   └── report.js

│   ├── admin.html

│   ├── claims-received.html

│   ├── dashboard.html

│   ├── design-preview.html

│   ├── index.html

│   ├── item-details.html

│   ├── login.html

│   ├── my-claims.html

│   ├── register.html

│   └── report-item.html

│

├── .gitignore

└── README.md

```



\## Installation and Local Setup



\### Prerequisites

\- Node.js and npm

\- MongoDB Community Server or MongoDB Atlas

\- Visual Studio Code (recommended)

\- A modern web browser

\- Live Server extension for VS Code (recommended)



\### 1. Clone the Repository



```bash

git clone YOUR\_GITHUB\_REPOSITORY\_URL

cd CampusFind

```



Replace the placeholder with your actual repository URL.



\### 2. Install Backend Dependencies



```bash

cd backend

npm install

```



\### 3. Configure Environment Variables



Create a local `.env` file from the example.



Windows PowerShell:



```powershell

Copy-Item .env.example .env

```



Configure the following variables in `backend/.env`:



```env

PORT=5000

NODE\_ENV=development

TRUST\_PROXY=false

MONGO\_URI=your\_mongodb\_connection\_string

JWT\_SECRET=your\_long\_random\_secret

CORS\_ORIGINS=http://127.0.0.1:5500,http://localhost:5500

```



Use your own MongoDB connection string and a strong, private JWT secret. Never upload your `.env` file to GitHub.



\### 4. Start the Backend



From the backend directory:



```bash

npm run dev

```



The API should run at:



`http://localhost:5000`



\### 5. Start the Frontend



1\. Open the project in Visual Studio Code.

2\. Open the `frontend` folder.

3\. Right-click `index.html`.

4\. Select \*\*Open with Live Server\*\*.



The frontend will normally be available at:



`http://127.0.0.1:5500`



\### 6. Configure the API URL



The frontend API address is centralized in:



`frontend/js/config.js`



For local development:



```javascript

window.CAMPUSFIND\_API\_BASE = "http://localhost:5000";

```



For production, update this address to the deployed backend URL.



\## API Overview



| Route | Purpose |

|---|---|

| `/api/auth` | Student registration and authentication |

| `/api/items` | Item reporting and listings |

| `/api/claims` | Claim submission and management |

| `/api/admin` | Administrative operations |



Protected routes require appropriate authentication and authorization.



\## Database



CampusFind uses MongoDB for storing application data.



The application uses Mongoose models for:

\- Users

\- Items

\- Claims



The database connection is configured through the `MONGO\_URI` environment variable.



\## Image Uploads



Uploaded item images are handled through Multer and processed using Sharp.



The current local development setup stores uploaded images in the backend uploads directory. Production deployment requires persistent or external image storage so uploaded images are not lost when a hosting instance is restarted or replaced.



\## Individual Contribution



This project was independently developed as an individual academic project.



My responsibilities included:

\- Planning and designing the application.

\- Developing the frontend using HTML, CSS, and JavaScript.

\- Implementing backend APIs using Node.js and Express.

\- Designing MongoDB models and database integration.

\- Implementing authentication and role-based authorization.

\- Integrating item reporting, image uploads, and claim management.

\- Developing the administrative dashboard.

\- Debugging, modifying, integrating, and testing application features.



The application was developed over approximately two weeks through individual planning, implementation, debugging, and testing.



\## AI Assistance Acknowledgement



AI tools were used as supplementary learning and development assistance for understanding technical concepts, troubleshooting errors, reviewing implementation approaches, and receiving coding guidance.



The project was independently planned, integrated, modified, and tested by the developer. AI assistance is acknowledged transparently and is not presented as a replacement for the developer's own work.



\## Future Improvements



\- Persistent cloud-based image storage.

\- Email notifications for claim updates.

\- Improved item matching and search.

\- More detailed administrative analytics.

\- Production deployment with database and hosting configuration.



\## Academic Purpose



CampusFind was developed as a practical academic project to apply concepts of web development, database management, backend programming, authentication, and software integration.



\---



\*\*Developed by Dibyaprotim Borah\*\*

B.Tech – Computer Science and Engineering (Sunstone) Industry Integrate

Assam down town University (ADTU)
