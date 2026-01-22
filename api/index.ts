import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setupApp } from '../server/app';

let appPromise: Promise<any> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!appPromise) {
        appPromise = setupApp().then(r => r.app);
    }
    const app = await appPromise;
    app(req, res);
}
