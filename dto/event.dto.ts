export interface Event<T> {
  /** Format: ULID (https://github.com/ulid/spec) */
  id: string;
  userId: string;
  event: Partial<T>;
}
