import { WebhookReceiver } from 'livekit-server-sdk';

class LivekitService {
    constructor() {
        this.receiver = new WebhookReceiver(
            `${process.env.LIVEKIT_API_KEY}`,
            `${process.env.LIVEKIT_API_SECRET}`
        );
    }

    validateWebhook(context, req) {
        try {
            const event = this.receiver.receive(
                req.bodyRaw,
                req.headers['authorization']
            );
            return event;
        } catch (err) {
            context.error(err);
            return null;
        }
    }
}

export default LivekitService;
