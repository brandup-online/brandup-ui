import { Middleware, StartContext } from "brandup-ui-app";

export class RealtimeMiddleware extends Middleware {
    start(context: StartContext, next: () => void, end: () => void) {
        super.start(context, next, end);
    }

    subscribe(id: string) {
        console.log(`subscribe: ${id}`)
    }
}