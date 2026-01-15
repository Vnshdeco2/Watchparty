const localtunnel = require('localtunnel');
const { spawn } = require('child_process');
const http = require('http');

console.log("Starting Local Watch Party in SHARE MODE...");

// Helper to get public IP
function getPublicIP() {
    return new Promise((resolve) => {
        http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
            resp.on('data', function(ip) {
                resolve(ip.toString());
            });
        }).on('error', () => {
            resolve("Unknown (Google 'what is my ip')");
        });
    });
}


// Prevent crash on tunnel connection drops
process.on('uncaughtException', (err) => {
    if (err.message && err.message.includes('connection refused: localtunnel.me')) {
        console.log("! Tunnel connection glitched (ignoring to keep server alive)...");
        return;
    }
    console.error('CRITICAL ERROR:', err);
    // clean up if critical
    process.exit(1); 
});

(async () => {
    try {
        // 1. Start Tunnel (Frontend Only - Backend is proxied!)
        console.log("Creating secure tunnel...");
        const frontendTunnel = await localtunnel({ port: 3000 });
        
        // Handle Tunnel Errors to prevent crash
        frontendTunnel.on('error', (err) => {
            console.error('FG Tunnel Error:', err.message);
        });

        const frontendUrl = frontendTunnel.url;
        const passwordIP = await getPublicIP();

        // 2. Start Backend Server
        console.log("Starting Backend Server...");
        const serverProcess = spawn('node', ['server/server.js'], { 
            stdio: 'inherit',
            shell: true 
        });

        // 3. Start Frontend Server (Port 3000)
        console.log("Starting Frontend Server on Port 3000...");
        
        // Ensure we kill any existing process on 3000
        const clientProcess = spawn('npm', ['run', 'dev', '--', '--port', '3000', '--host'], { 
            cwd: './client',
            stdio: 'inherit',
            shell: true,
            // No VITE_SERVER_URL needed! Relative path works via Proxy now.
        });
        
        // Give servers a sec
        await new Promise(r => setTimeout(r, 2000));

        console.log('\n======================================================');
        console.log('           WATCH PARTY IS ONLINE!');
        console.log('======================================================');
        console.log('1. Share this link with your friend:');
        console.log('\x1b[32m%s\x1b[0m', frontendUrl); // Green color
        console.log('\n2. If asked for a "Tunnel Password", enter this IP:');
        console.log('\x1b[36m%s\x1b[0m', passwordIP); // Cyan color
        console.log('======================================================\n');
        
        console.log('Backend is proxied through frontend.');
        console.log('Press Ctrl+C to stop sharing.');

        // Cleanup on exit
        const cleanup = () => {
            serverProcess.kill();
            clientProcess.kill();
            // backendTunnel.close(); // Removed
            frontendTunnel.close();
            process.exit();
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        backendTunnel.on('close', () => console.log('Backend tunnel closed'));
        frontendTunnel.on('close', () => console.log('Frontend tunnel closed'));

    } catch (err) {
        console.error("Error starting share mode:", err);
    }
})();
