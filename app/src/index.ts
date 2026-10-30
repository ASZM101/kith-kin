import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt"

function generateNonce(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
}

const validSpends = [1, 5, 10];

const users = await Bun.file("users.json").json();
const pets = await Bun.file("pets.json").json();

const questions = (await Bun.file("questions.txt").text())
    .split(/\r?\n/)
    .filter(line => line.trim() !== "");

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

    if (users[username].password === digest) {
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
        return status(401, 'Revoked or invalid token');
    }

    return {
        username: payload.sub,
        nonce: payload.nonce
    };
})
.get("/profile", ({ username }) => `Hello, ${username}`)
.get("/info", ({ username, status }) => {
    if (!users[username]) {
        return status(500, "User does not exist");
    } else if (pets[users[username].pet] === undefined) {
        return status(500, "Pet does not exist");
    }

    return {
        coins: users[username].coins,
        happiness: pets[users[username].pet]
    };
})
.post("/spend", ({ username, body, status }) => {
    if (!users[username]) {
        return status(500, "User does not exist");
    } else if (pets[users[username].pet] === undefined) {
        return status(500, "Pet does not exist");
    }

    const { coins } = body;

    if (!validSpends.includes(coins)) {
        return status(403, "Invalid coin expenditure");
    }

    if (users[username].coins < coins) {
        return status(403, "Insufficient coins");
    }

    pets[users[username].pet] = Math.min(100, pets[users[username].pet] + coins);
    users[username].coins -= coins;

    return status(200, "OK");
}, {
        body: t.Object({
            coins: t.Integer()
        })
    })
.get("/question", () => questions[Math.floor(Math.random() * questions.length)])
.post("/question", ({ username, body, status }) => {
    const { question, answer } = body;
    if (!question || !answer) {
        return status(400, 'Bad Request');
    }
    if (!questions.includes(question)) {
        return status(400, 'Bad Request');
    }

    users[username].answers.push({
        question,
        answer
    });
    users[username].coins += 5;
    return status(201, "Created answer")
}, {
        body: t.Object({
            question: t.String(),
            answer: t.String()
        })
    })
.get("/history", ({ username, query, status }) => {
    let { page, count } = query;
    if (!users[username]) {
        return status(500, "User does not exist")
    }
    
    const startIdx = (page ?? 0) * (count ?? 5);
    return status(200, users[username].answers.slice(startIdx, startIdx + (count ?? 5)));
}, {
        query: t.Object({
            page: t.Optional(t.Number()),
            count: t.Optional(t.Number())
        })
    })
.post("/logout", ({ nonce }) => {
    nonces.delete(nonce);
    return "Logged out!";
})
.listen(3000);

console.log(
    `running on ${app.server?.hostname}:${app.server?.port}`
);

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...')

    await app.stop()
    console.log('Server stopped.')

    await Bun.write("users.json", JSON.stringify(users, null, 2));
    await Bun.write("pets.json", JSON.stringify(pets, null, 2));
    process.exit(0)
})
