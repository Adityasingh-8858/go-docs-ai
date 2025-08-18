# IntelliDocs AI

Welcome to IntelliDocs AI, a feature-rich, AI-powered SaaS platform that transforms your static PDFs into dynamic, interactive knowledge bases. Users can subscribe to a plan, upload PDF documents, and interact with them using AI to chat, summarize, and extract key information.

## 🚀 Core Features

- **Secure Authentication**: Social and password-based sign-up/login powered by **Clerk**.
- **Tiered Subscriptions**: Basic, Pro, and Plus plans with varying limits, managed by **Stripe**.
- **Intelligent PDF Processing**: Securely upload and process PDFs for AI interaction.
- **AI-Powered Chat**: Use **Groq** for real-time chat and **Gemini** for complex queries to ask questions about your documents.
- **RAG Pipeline**: Leverages a Retrieval-Augmented Generation pipeline with **LangChain** and a **Pinecone** vector database for accurate, context-aware answers.
- **User Dashboard**: A central hub to manage documents, billing, and user settings.

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & ShadCN UI
- **Authentication**: Clerk
- **Primary Database**: Supabase (PostgreSQL)
- **Vector Database**: Pinecone
- **Payments**: Stripe
- **AI Orchestration**: LangChain.js
- **AI Models**: Google Gemini & Groq (Llama 3)
- **Deployment**: Docker, Heroku, DigitalOcean
- **CI/CD**: GitHub Actions

---

## 🏁 Getting Started (Local Development)

Follow these instructions to set up and run the project on your local machine.

### 1. Prerequisites

- **Node.js**: Version 20.x or later.
- **npm/yarn/pnpm**: A Node.js package manager.
- **Docker**: (Optional) For running the application in a containerized environment.
- **Git**: For cloning the repository.

### 2. Clone the Repository

```bash
git clone <repository-url>
cd intellidocs-ai
```

### 3. Set Up Environment Variables

All environment variables are managed in a single file.

1.  Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
2.  Open `.env.local` and fill in the values. You will need to create accounts and get API keys from the following services:
    - **Clerk**: [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
    - **Supabase**: [https://supabase.com/](https://supabase.com/)
    - **Pinecone**: [https://www.pinecone.io/](https://www.pinecone.io/)
    - **Stripe**: [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
    - **Google (for Gemini)**: [https://aistudio.google.com/](https://aistudio.google.com/)
    - **Groq**: [https://console.groq.com/](https://console.groq.com/)

### 4. Set Up the Database (Supabase)

1.  Go to your Supabase project dashboard.
2.  Navigate to the **SQL Editor**.
3.  Copy the entire content of the `schema.sql` file from this repository.
4.  Paste the SQL into the editor and click **Run**. This will create the `users` and `documents` tables, set up the triggers, and enable Row Level Security (RLS).
5.  **Important**: You also need to create a **Storage Bucket** named `documents` in your Supabase project for the PDF files to be stored.

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

---

## ☁️ DevOps and Deployment

This project is configured for CI/CD with GitHub Actions and can be deployed to Heroku or DigitalOcean.

### CI/CD with GitHub Actions

The `.github/workflows/main.yml` file defines the CI/CD pipeline.

-   **Trigger**: The workflow runs on every `push` or `pull_request` to the `main` branch.
-   **`build-and-test` Job**: This job installs dependencies, runs the linter (`npm run lint`), and builds the application (`npm run build`) to ensure code quality and correctness.
-   **Deployment Jobs**: The workflow includes placeholder jobs for deploying to Heroku and DigitalOcean. To enable them, you must add the required secrets to your GitHub repository settings (`Settings > Secrets and variables > Actions`).

**Required GitHub Secrets:**

-   `HEROKU_API_KEY`: Your Heroku account API key.
-   `HEROKU_APP_NAME`: The name of your app on Heroku.
-   `HEROKU_EMAIL`: The email associated with your Heroku account.
-   `DIGITALOCEAN_ACCESS_TOKEN`: Your DigitalOcean API token.
-   `DO_APP_NAME`: The name of your app on DigitalOcean App Platform.

### Deployment to Heroku

Heroku deployment uses the `Procfile` to start the application.

1.  **Install Heroku CLI**: Follow the instructions [here](https://devcenter.heroku.com/articles/heroku-cli).
2.  **Log in to Heroku**:
    ```bash
    heroku login
    ```
3.  **Create a Heroku App**:
    ```bash
    heroku create your-app-name
    ```
4.  **Set Environment Variables**: Go to your Heroku app's dashboard, navigate to `Settings > Config Vars`, and add all the environment variables from your `.env.local` file.
5.  **Deploy**: You can deploy manually via Git or automatically via the configured GitHub Action.
    -   **Manual Git Push**:
        ```bash
        git push heroku main
        ```
    -   **GitHub Action**: The `deploy-to-heroku` job will run automatically on a push to `main` if you have configured the secrets.

### Deployment to DigitalOcean App Platform

DigitalOcean deployment uses the `Dockerfile` to build and run the application.

1.  **Create an App**: Go to your DigitalOcean dashboard and create a new **App** on the App Platform.
2.  **Link Repository**: Connect your GitHub account and select the `intellidocs-ai` repository.
3.  **Configure the App**:
    -   DigitalOcean will automatically detect the `Dockerfile` and configure the web service.
    -   **Environment Variables**: In the app's settings, go to the **"Environment Variables"** section and add all the variables from your `.env.local` file. You can use the "Bulk Edit" option to copy-paste them.
    -   **HTTP Port**: Ensure the port is set to `3000`.
4.  **Deploy**: Finalize the app creation. The App Platform will automatically build the image from the `Dockerfile` and deploy the application. Future pushes to the `main` branch will trigger automatic redeployments.

---

## ⚠️ Production Considerations

### Asynchronous PDF Processing

The current implementation triggers the PDF processing asynchronously from the `/api/upload` endpoint. While this works for development and small-scale use, it has limitations in a production serverless environment (like Vercel or Heroku).

-   **Problem**: Serverless functions have a maximum execution timeout (e.g., 10-60 seconds). Processing a very large or complex PDF could exceed this limit, causing the process to fail silently.
-   **Solution**: For a robust, scalable production application, you should use a dedicated **message queue** and a **background worker**.
    1.  **Queue**: Instead of calling `processPDF()` directly, the upload API should push a job message (containing the `fileKey` and `documentId`) to a queue service like [Supabase PGQ](https://supabase.com/docs/guides/database/extensions/pgq), RabbitMQ, or AWS SQS.
    2.  **Worker**: You would have a separate, long-running worker process (e.g., a separate Node.js service running on a Heroku worker dyno or a container) that listens to the queue. When a new job appears, the worker picks it up and executes the `processPDF` function. This architecture decouples the long-running task from the short-lived API request, ensuring reliability.

---

## 📂 Project Structure

```
/
|-- .github/            # GitHub Actions CI/CD workflows
|-- app/                # Next.js App Router: pages and API routes
|   |-- (auth)/         # Clerk sign-in/sign-up pages
|   |-- (dashboard)/    # Protected dashboard pages
|   |-- api/            # Backend API routes
|-- components/         # Reusable React components
|   |-- ui/             # ShadCN UI components
|   |-- dashboard/      # Dashboard-specific components
|   |-- landing/        # Landing page sections
|-- lib/                # Core helper functions and clients (Supabase, Stripe, etc.)
|-- public/             # Static assets
|-- .env.example        # Example environment variables
|-- Dockerfile          # For containerized deployment (DigitalOcean)
|-- package.json        # Project dependencies and scripts
|-- Procfile            # For Heroku deployment
|-- schema.sql          # SQL schema for the Supabase database
```
