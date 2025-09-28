export interface DomainEvent<
  TType extends string = string,
  TPayload = unknown,
> {
  type: TType;
  at: Date;
  payload: TPayload;
}

export interface DomainEventBus {
  emit<T extends DomainEvent>(event: T): void;
  // Simple observable-like subscribe API without importing rxjs here (keep lib light)
  subscribe(handler: (e: DomainEvent) => void): () => void;
}

export class InMemoryDomainEventBus implements DomainEventBus {
  private handlers: Set<(e: DomainEvent) => void> = new Set();
  emit<T extends DomainEvent>(event: T): void {
    this.handlers.forEach((h) => {
      try {
        h(event);
      } catch {
        /* swallow */
      }
    });
  }
  subscribe(handler: (e: DomainEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
