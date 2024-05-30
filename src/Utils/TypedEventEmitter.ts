import EventEmitter from "eventemitter3"

//Code source: https://blog.makerx.com.au/a-type-safe-event-emitter-in-node-js/
export class TypedEventEmitter<TEvents extends Record<string, any>> {
    private emitter = new EventEmitter()

    emit<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        ...eventArg: TEvents[TEventName]
    ) {
        this.emitter.emit(eventName, ...(eventArg as []))
    }

    on<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.on(eventName, handler as any)
    }
    
    off<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.off(eventName, handler as any)
    }
    once<TEventName extends keyof TEvents & string>(
        eventName: TEventName,
        handler: (...eventArg: TEvents[TEventName]) => void
    ) {
        this.emitter.once(eventName, handler as any)
    }
    waitForEvent<TEventName extends keyof TEvents & string>(event: TEventName): Promise<any> {
        return new Promise((resolve, reject) => {
            this.emitter.once(event, resolve);
            this.once("error", reject);        
        });
    }
}