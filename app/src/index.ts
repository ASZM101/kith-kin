import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt"

function generateNonce(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
}

const users = await Bun.file("users.json").json();
const nonces = new Set<string>();

const app = new Elysia()
.use(
    jwt({
        name: 'jwt',
        secret: Bun.env.JWT_SECRET || generateNonce()
    })
)
.post("/login", async ({ jwt, body, status }) => {
    const { username, password } = body;

    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(password);
    const digest = hasher.digest("hex");

    if (users[username] === digest) {
        const nonce = generateNonce();
        nonces.add(nonce);
        const token = await jwt.sign({
            sub: body.username,
            nonce
        });
        return { token };
    } else {
        return status(401, 'Unauthorized');
    }
}, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    }
)
.resolve(async ({ jwt, request, status }) => {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return status(401, 'Unauthorized')
    }

    const token = authorization.split(' ')[1]
    const payload = await jwt.verify(token);
    
    if (!payload) {
        return status(401, 'Invalid or expired token');
    }

    if (!nonces.has(payload.nonce)) {
        return status(401, 'Revoked or invaild token');
    }

    return {
        username: payload.sub,
        nonce: payload.nonce
    };
})
.get("/profile", ({ username }) => `Hello, ${username}`)
.post("/logout", ({ nonce }) => {
    nonces.delete(nonce);
    return "Logged out!";
})
.listen(3000);

console.log(
    `running on ${app.server?.hostname}:${app.server?.port}`
);
