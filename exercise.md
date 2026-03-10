# Deployment Exercise

This exercise walks you through deploying this project -- a FastAPI backend + React frontend -- to production. We'll put the API on an AWS EC2 instance and the React app on Vercel.

A great place to start reading about deployment with FastAPI is the official docs: https://fastapi.tiangolo.com/deployment/

This article also walks through a similar setup if you want another reference:
https://dylancastillo.co/posts/fastapi-nginx-gunicorn.html

But generally speaking, deployment can be done many ways. It ultimately means setting up our project in production and exposing it to the internet. We'll have to consider:

- How to deploy our API, and make sure it's robust
- How to deploy our frontend, and make sure it works across domains
- Do we put our database on our server, or separately?
- How does the frontend talk to the backend once they're on different servers?

Here's what we'll cover:

- Using AWS EC2 to deploy the backend
- Elastic IP - making sure our IP address doesn't change (is static)
- Custom domain which I've bought on a DNS provider
- Nginx (reverse proxy) to allow for multiple servers
- Security - HTTPS using Let's Encrypt
- Running on startup (Supervisor)
- Restarts (Supervisor)
- Running multiple worker processes with Uvicorn
- Logging locally on the machine
- Deploying the React frontend on Vercel

### Bonus stuff

Bonus, which we might add later, or should be considered:

- GitHub Actions for automatic deployment on push
- Rate limiting (see appendix at the bottom)
- Load balancing (scaling instances up and down depending on the load, instead of having a very large instance constantly running)
- Scheduling using a separate service or same depending on whether or not load balancing is used (we can't schedule on the server itself if we use load balancing, since load balancing creates multiple versions of the same EC2 instance)
- Backup strategies
- Logging on external service, e.g Sentry or Kibana
- Automatic tests
- Staging environment with automatic tests
- Docker

# Deploying the API

## Setting up the EC2 instance

Create an EC2 instance on AWS, you'll probably need at least 1GB RAM and 2 CPU cores, but it really depends on your needs. If your app expects to receive more traffic, usually you'll end up setting up load balancing which can "spawn" new instances of your server, and remove them, depending on the load. A good rule of thumb is that the more CPU cores you have, the more requests you'll be able to process, assuming you end up spawning more workers for your API process (more about that later).

## Security group

Make sure to add an inbound security group which allows HTTP, HTTPS and SSH as follows:

Click "Add rule" for each of these:

- **SSH**:
    - Type: SSH
    - Protocol: TCP
    - Port range: 22
    - Source: For better security, restrict to your IP (select "My IP") or a specific IP range
- **HTTP**:
    - Type: HTTP
    - Protocol: TCP
    - Port range: 80
    - Source: 0.0.0.0/0 (anywhere)
- **HTTPS**:
    - Type: HTTPS
    - Protocol: TCP
    - Port range: 443
    - Source: 0.0.0.0/0 (anywhere)
- TCP on port 8000 (**WE'LL REMOVE THIS LATER** -- just for initial testing)

## Elastic IP

Create an Elastic IP -- this is really important, since soon we'll buy a custom domain and point it at our server IP. That means our IP must stay the same, even if we restart the instance. Without a static IP and custom domain, we can't use HTTPS.

- In the AWS Console, go to EC2 > Elastic IPs
- Allocate a new Elastic IP
- Associate it with your EC2 instance

## Setting up a cloud database

We don't HAVE to use a remote database, but it's better practice to separate the application from the database, generally speaking. We'll use AWS RDS.

### Create the RDS instance

- Create a PostgreSQL database with minimal specs
- Make sure to set it to "publicly accessible" -- this doesn't mean anyone can connect, it just means connections from outside the VPC are possible (we still control access with security groups)
- Pick a master username and password -- you'll need these for your connection string later

### Set up the security group for the database

When you create the RDS instance, AWS will create a security group for it (or you can create one yourself). This security group controls who can connect to the database on port 5432.

By default, if you set the instance to "public", AWS adds an inbound rule allowing your current IP address. That's nice because it means you can connect from your local machine right away (e.g via pgAdmin). But your EC2 instance won't be able to connect yet -- we need to allow that too.

Go to the RDS security group and add an inbound rule:

- **Type**: PostgreSQL
- **Protocol**: TCP
- **Port range**: 5432
- **Source**: The security group of your EC2 instance (start typing `sg-` and it should show up in the dropdown)

Using the EC2's security group as the source (instead of a specific IP) is cleaner -- it means any instance using that security group can connect, and it keeps working even if the instance's private IP changes.

So you should end up with at least two inbound rules on the RDS security group:

1. Port 5432 from **your IP** (so you can connect via pgAdmin locally)
2. Port 5432 from **the EC2 security group** (so your server can connect)

### Verify the connection from your EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-elastic-ip
```

Install the PostgreSQL client and try connecting:

```bash
sudo apt-get update && sudo apt-get install postgresql-client -y
psql -h your-rds-host.eu-north-1.rds.amazonaws.com -U postgres -d postgres -W
```

It'll prompt you for the password. If you get a psql prompt, the connection works. Type `\q` to exit.

If it hangs or times out, double-check the security group rules -- most likely the EC2 security group isn't allowed in the RDS inbound rules yet.

### Create the database and connect via pgAdmin

From your local machine, open pgAdmin and register a new server:

- Right-click on Servers > Register > Server
- **Name**: whatever you want (e.g "RDS Production")
- **Connection tab**: enter the RDS host, port (5432), username and password

Once connected, create a new database, e.g `yh_admin`. This is the database your app will use.

## Deploy your application (basic version)

Set up your SSH keys and then update and install packages:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx supervisor micro htop
```

Create a directory for your application:

```bash
mkdir -p ~/fastapi-app
cd ~/fastapi-app
```

Clone your repository:

```bash
git clone https://github.com/yourusername/your-repo.git .
```

Now, this project has both `backend/` and `frontend/` directories. We only need the backend on the EC2 instance. Set up a Python virtual environment inside the `backend/` directory since that's where our API code lives:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Configure environment variables

This project uses a `.env` file for configuration. There's a `.env.example` you can use as a starting point:

```bash
cp .env.example .env
micro .env
```

Here's what the variables mean:

- `DB_URL` -- the PostgreSQL connection string pointing at your RDS instance
- `ACCESS_TOKEN_EXPIRE_MINUTES` -- how long auth tokens are valid (in minutes)
- `CORS_ORIGINS` -- comma-separated list of frontend origins allowed to call our API

For example:

```
DB_URL=postgresql+psycopg2://postgres:yourpassword@your-rds-host.eu-north-1.rds.amazonaws.com/yh_admin
ACCESS_TOKEN_EXPIRE_MINUTES=480
CORS_ORIGINS=http://localhost:5173
```

The important thing here is the `DB_URL` -- it needs to point at your RDS instance. You'll update `CORS_ORIGINS` later once you have a Vercel URL for the frontend.

## Seed the database

Before starting the app for the first time, you need to run the seed script. This creates the default roles (admin, utbildningsledare, student) and lets you set up an initial admin user:

```bash
source venv/bin/activate
python -m scripts.seed_db
```

It'll ask you for the admin user's details interactively.

## Test your application

Let's run the app in its simplest form:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Now you can test if your API works by accessing:

```
http://your-ec2-public-ip:8000/docs
```

You should see the FastAPI docs page. This confirms the app is running and can talk to your database, but this setup has several limitations:

- It's running in the foreground (will stop if you close the SSH session)
- It's not using HTTPS
- It's directly exposed on port 8000 -- we should use a reverse proxy instead (Nginx)
- It's only running a single worker

## IMPORTANT! Now remove the inbound rule that allows traffic on port 8000 from your security group.

## Nginx: Implementing a reverse proxy

Now that we've verified our FastAPI application runs correctly on port 8000, let's add Nginx to the mix. Directly accessing your API on port 8000 works for testing, but it's not ideal for a production environment (we're not using HTTPS).

### So what is Nginx?

Nginx (pronounced "engine-x") is a high-performance web server and reverse proxy. Think of it as a doorman for your application -- it handles incoming traffic, directs it appropriately, and adds several important benefits:

- **Security**: Nginx shields your application from direct exposure to the internet
- **Professional setup**: Allows clients to connect through standard ports (80/443) instead of custom ports
- **Performance**: Efficiently handles multiple connections and serves static content (e.g images)
- **Flexibility**: Enables multiple applications to run on the same server (e.g we might want multiple web servers on our linux machine, Nginx will reroute the traffic to the right application, but we need to specify that)
- **HTTPS support**: Simplifies adding SSL/TLS encryption to your API

Without Nginx, you'd face several challenges:

- Your API would be directly exposed to potential attacks
- You'd need to secure port 8000 separately
- Setting up HTTPS would be more complicated
- You couldn't easily host multiple services on the same server

Let's set up Nginx as a reverse proxy to address these concerns.

### Install Nginx

If you haven't already installed Nginx:

```bash
sudo apt install -y nginx
```

### Configure Nginx as a reverse proxy

Create a new configuration file:

```bash
sudo micro /etc/nginx/sites-available/fastapi
```

Add the following configuration:

```
# Basic server configuration for our FastAPI application
server {
    # Listen on standard HTTP port
    listen 80;

    # For now, respond to any domain name (we'll update this later)
    server_name _;

    # Log configuration for easier troubleshooting
    access_log /var/log/nginx/fastapi-access.log;
    error_log /var/log/nginx/fastapi-error.log;

    # Main configuration - forward all requests to our FastAPI app
    location / {
        # Forward requests to our FastAPI app running on port 8000
        proxy_pass http://localhost:8000;

        # Forward important headers to preserve client information
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the configuration

Create a symbolic link to enable it:

```bash
sudo ln -s /etc/nginx/sites-available/fastapi /etc/nginx/sites-enabled/
```

Remove the default site to avoid conflicts:

```bash
sudo rm /etc/nginx/sites-enabled/default
```

Test your configuration for syntax errors:

```bash
sudo nginx -t
```

If the test passes, restart Nginx:

```bash
sudo systemctl restart nginx
```

### Test your API through Nginx

Your API should now be accessible through Nginx on the standard HTTP port:

```
http://your-ec2-public-ip/docs
```

Nice! Nginx is now receiving all incoming HTTP requests on port 80 and forwarding them to your FastAPI application running on port 8000, all while adding an important layer of security and flexibility. However... it's not using HTTPS or even a custom domain yet. We'll get to that.

## Setting up Supervisor for process management

After configuring Nginx, we need to ensure our FastAPI application runs reliably, automatically restarts after failures, and starts when the server boots up. This is where Supervisor comes in.

### What is Supervisor?

Supervisor is what we call a process manager, the main idea is that it's supposed to manage a process by being able to log things that happen to it, restart it if needed, and make sure it starts whenever the server starts (it's able to do this because it runs as a "daemon", a background process itself). Basically, you can't just run `uvicorn main:app` in the terminal and expect it to keep running once you exit -- you need some other process that runs that command for us and handles different scenarios.

### Install Supervisor

```bash
sudo apt install -y supervisor
```

### Create a configuration file

Create a directory for logs:

```bash
sudo mkdir -p /var/log/fastapi
sudo chown ubuntu:ubuntu /var/log/fastapi  # Replace 'ubuntu' with your username if different
```

Create a Supervisor configuration file:

```bash
sudo micro /etc/supervisor/conf.d/fastapi.conf
```

Add the following configuration. Note the paths -- the venv and working directory both point into the `backend/` subdirectory:

```
[program:fastapi]
# Uses the virtual environment's uvicorn, runs 4 worker processes
command=/home/ubuntu/fastapi-app/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Working directory - must be where main.py and .env live
directory=/home/ubuntu/fastapi-app/backend

# System user under which the application runs
user=ubuntu

# Start on boot, restart on crash
autostart=true
autorestart=true

# Make sure all child processes (workers) get stopped together
stopasgroup=true
killasgroup=true

# Logging
stderr_logfile=/var/log/fastapi/fastapi.err.log
stdout_logfile=/var/log/fastapi/fastapi.out.log
```

### Start it up

Reload the configuration and start the application:

```bash
sudo supervisorctl reread
sudo supervisorctl update
```

Check the status of your application:

```bash
sudo supervisorctl status fastapi
```

You should see something like:

```
fastapi                          RUNNING   pid 12345, uptime 0:01:23
```

But the main thing we need to confirm is whether or not Uvicorn is running multiple Python processes:

```bash
sudo lsof -i :8000

# Example output
COMMAND  PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
uvicorn 1358 ubuntu    3u  IPv4  10860      0t0  TCP *:8000 (LISTEN)
python3 1360 ubuntu    3u  IPv4  10860      0t0  TCP *:8000 (LISTEN)
python3 1361 ubuntu    3u  IPv4  10860      0t0  TCP *:8000 (LISTEN)
python3 1362 ubuntu    3u  IPv4  10860      0t0  TCP *:8000 (LISTEN)
python3 1363 ubuntu    3u  IPv4  10860      0t0  TCP *:8000 (LISTEN)
```

Now your FastAPI application will:

- Automatically start when the server boots
- Restart if it crashes
- Run with multiple worker processes for better performance
- Log output to dedicated log files

## Setting up a custom domain

Now that our application is running reliably behind Nginx, let's configure a custom domain.

Buy a domain at a DNS provider of choice, e.g misshosting.com, simply.com, namecheap.com -- it doesn't really matter, but you might want one which supports email inboxes, since most apps end up needing that.

Using a subdomain like `api.yourdomain.com` for the backend is a nice pattern if you want the main domain for the frontend later.

In your DNS provider dashboard (e.g cPanel > Zone Editor), create an A record:

- Type: A
- Name: @ (or a subdomain like `api`)
- Value: Your Elastic IP address

### Update Nginx for your domain

```bash
sudo micro /etc/nginx/sites-available/fastapi
```

Update the `server_name` directive:

```
server {
    listen 80;
    # Replace with your actual domain
    server_name yourdomain.com www.yourdomain.com;

    # Rest of the configuration remains the same
    ...
}
```

Test the configuration and restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

Wait for DNS propagation (can take up to 24-48 hours, but normally within 10 mins) and then test accessing your API via your domain:

```
http://yourdomain.com/docs
```

## Implementing HTTPS with Let's Encrypt

Now that your domain is configured, let's secure your API with HTTPS.

### Install Certbot

We'll use the recommended snap method to install Certbot:

```bash
# Remove any existing certbot installations first (important!)
sudo apt-get remove certbot

# Install using snap
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Create a backup of your Nginx config (just in case)

```bash
sudo cp /etc/nginx/sites-available/fastapi /etc/nginx/sites-available/fastapi.backup
```

### Obtain SSL certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --agree-tos --email yourmail@gmail.com
```

Certbot will automatically modify your Nginx configuration to enable HTTPS and set up a redirect from HTTP to HTTPS.

### Verify auto-renewal

Certbot installed via snap includes automatic renewal. Test the renewal process with:

```bash
sudo certbot renew --dry-run
```

You should see a message indicating the dry run was successful.

Renewing SSL (HTTPS) certificates is fairly easy -- in the current implementation where we installed Certbot using snap, it will take care of renewal itself. We can confirm it using:

```bash
sudo certbot certificates
sudo snap list certbot
# OR even..
systemctl status snap.certbot.renew.timer
```

It's totally possible to renew it manually though using a scheduled cron job or similar, e.g:

```bash
sudo certbot renew --force-renewal
```

## Setting up logging

You can view logs at any time with:

```bash
# Application error logs
sudo tail -f /var/log/fastapi/fastapi.err.log

# Application output logs
sudo tail -f /var/log/fastapi/fastapi.out.log

# Nginx access logs
sudo tail -f /var/log/nginx/fastapi-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/fastapi-error.log
```

## Final checks

Now that everything is set up, do these final tests:

1. Verify your API is accessible over HTTPS:

    ```
    https://yourdomain.com/docs
    ```

2. Verify HTTP redirects to HTTPS:

    ```
    http://yourdomain.com/docs  # Should redirect to HTTPS
    ```

3. Check Supervisor status:

    ```bash
    sudo supervisorctl status fastapi
    ```

4. Restart your EC2 instance and verify everything comes back up automatically:

    ```bash
    sudo reboot
    ```

    After a couple of minutes, reconnect and check:

    ```bash
    sudo supervisorctl status fastapi
    ```

If everything's green, your backend is properly deployed with:

- Nginx as a reverse proxy
- Supervisor for process management and automatic restarts
- Multi-worker Uvicorn for better performance
- Custom domain with HTTPS encryption
- Logging

---

# Deploying the frontend on Vercel

Deploying a React app is comparatively easy. We'll use Vercel since it's free for hobby projects and works really well with Vite.

Remember, we're deploying the frontend and the backend on different servers now, probably with different domains. That's why we set up `CORS_ORIGINS` on the backend -- it tells the API which domains are allowed to make requests to it.

## A few things to know about Vite + Vercel

Before we start, there are some things worth understanding:

- **`VITE_API_URL` is baked in at build time.** Vite replaces all `import.meta.env.VITE_*` values during `npm run build`. They're statically embedded in the built JavaScript. This means if you change the API URL later, you need to **redeploy** the frontend for it to take effect -- it won't pick up changes dynamically.
- **SPA routing needs a rewrite rule.** Since React Router handles routing on the client side, any direct navigation to a path like `/dashboard/programs` would 404 on Vercel without a rewrite rule. This project already has a `vercel.json` in `frontend/` that handles this -- it tells Vercel to serve `index.html` for all paths and let React Router sort it out.
- **The frontend is in a subdirectory.** The React app lives in `frontend/`, not the repo root. You need to tell Vercel where to find it, otherwise the build will fail because it'll look for `package.json` in the repo root.

## Step 1: Push your code to GitHub

Make sure your repo is on GitHub with all the latest changes. Vercel will pull from there.

## Step 2: Create a Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click "Add New..." > "Project"
3. Import your GitHub repository

## Step 3: Configure the project settings

This is where you need to pay attention:

- **Root Directory**: Set this to `frontend`. This is important -- Vercel needs to know where `package.json` lives.
- **Framework Preset**: Vercel should auto-detect "Vite". If not, select it manually.
- **Build Command**: `npm run build` (this is the default, should be fine)
- **Output Directory**: `dist` (also the default for Vite)

## Step 4: Set the environment variable

Under "Environment Variables" in the project settings, add:

- **Key**: `VITE_API_URL`
- **Value**: `https://yourdomain.com/v1`

Make sure to include `/v1` at the end -- that's the API version prefix the backend uses. All API routes live under `/v1`, so without it your frontend won't be able to reach any endpoints.

## Step 5: Deploy

Click "Deploy" and Vercel will:

1. Clone your repo
2. `cd` into the `frontend/` directory
3. Run `npm install`
4. Run `npm run build` (which injects `VITE_API_URL` into the built JavaScript)
5. Serve the `dist/` folder

Once it's done you'll get a URL like `your-project.vercel.app`.

## Step 6: Update backend CORS

Now go back to your EC2 server and add the Vercel domain to your `CORS_ORIGINS`:

```bash
micro ~/fastapi-app/backend/.env
```

Update the `CORS_ORIGINS` line:

```
CORS_ORIGINS=https://your-project.vercel.app,http://localhost:5173
```

You can list multiple origins separated by commas. Keep `http://localhost:5173` in there for local development.

Then restart the backend so it picks up the change:

```bash
sudo supervisorctl restart fastapi
```

## Step 7: Test it

Open your Vercel URL in the browser. You should be able to:

- See the landing page
- Log in with the admin credentials you set up during seeding
- Navigate around the dashboard
- All API calls should go through your HTTPS backend

If you get CORS errors in the browser console, double-check that the `CORS_ORIGINS` value on the backend matches the exact Vercel URL (no trailing slash, correct protocol).

## Optional: Custom domain on Vercel

If you want a custom domain for the frontend too (e.g `app.yourdomain.com`):

1. Go to your Vercel project > Settings > Domains
2. Add your domain
3. Vercel will give you DNS records to add at your DNS provider
4. Vercel handles HTTPS automatically

If you use a custom domain, remember to update `CORS_ORIGINS` on the backend to include that new domain too.

## Redeploying after changes

Any push to your main branch on GitHub will trigger a new Vercel deployment automatically. If you change `VITE_API_URL` or other env vars in the Vercel dashboard, you'll need to redeploy for the changes to take effect (there's a "Redeploy" button in the Vercel dashboard).

---

# Appendix: Rate limiting (bonus)

This section covers rate limiting if you want to protect your auth endpoints from brute-force attacks. It's not required for the basic deployment but is good practice for anything facing the public internet.

## Using slowapi (Python-level)

There are multiple approaches to rate limiting, and they have their pros and cons. We could use `slowapi` which is a simple package that works for basic use cases (it's memory-based). We could also use Nginx's built-in rate limiting, which is more performant and a good idea if you want basic DDoS protection. And finally, for something more serious, you'd use Redis or Memcached as a backing store (`slowapi` has support for both). You can also combine approaches.

### Install slowapi

```bash
pip install slowapi
```

### Add rate limits to auth endpoints

```python
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(tags=["auth"], prefix="/auth")

# Rate limit login attempts (10 per minute per IP)
@router.post("/token")
@limiter.limit("10/minute")
def login(
    request: Request,  # Required for rate limiting
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
) -> TokenSchema:
    # Your existing login code stays the same
    ...
```

### Register the limiter in main.py

```python
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

## Nginx rate limiting (server-level)

Add rate limit zones to your Nginx config:

```
# Define a zone for login requests
limit_req_zone $binary_remote_addr zone=auth_login:10m rate=2r/s;

server {
    # ... your existing config ...

    # Rate limit the login endpoint
    location /v1/auth/token {
        limit_req zone=auth_login burst=10 nodelay;
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Default location for everything else
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

To see rate limit violations:

```bash
sudo tail -f /var/log/nginx/error.log | grep limiting
```
