declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    user?: string;
    password?: string | (() => string | Promise<string>);
    host?: string;
    port?: number;
    database?: string;
    ssl?: any;
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    maxUses?: number;
    [key: string]: any;
  }

  export interface QueryResultRow {
    [column: string]: any;
  }

  export interface QueryResult<R extends QueryResultRow = any> {
    rows: R[];
    fields: any[];
    rowCount: number;
    command: string;
    oid: number;
  }

  export interface PoolClient {
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryTextOrConfig: string | any,
      values?: I
    ): Promise<QueryResult<R>>;
    release(err?: Error | boolean): void;
    [key: string]: any;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    connect(callback: (err: Error, client: PoolClient, done: (release?: any) => void) => void): void;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryTextOrConfig: string | any,
      values?: I
    ): Promise<QueryResult<R>>;
    end(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): this;
    [key: string]: any;
  }

  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query<R extends QueryResultRow = any, I extends any[] = any[]>(
      queryTextOrConfig: string | any,
      values?: I
    ): Promise<QueryResult<R>>;
    end(): Promise<void>;
    [key: string]: any;
  }

  export class ClientBase {
    [key: string]: any;
  }

  export const types: any;
  export const defaults: any;
  export const native: any;
  export type BindConfig = any;
  export type ClientConfig = any;
  export type Connection = any;
  export type ConnectionConfig = any;
  export type CustomTypesConfig = any;
  export type Defaults = any;
  export type Events = any;
  export type ExecuteConfig = any;
  export type FieldDef = any;
  export type MessageConfig = any;
  export type Notification = any;
  export type Query = any;
  export type QueryArrayConfig = any;
  export type QueryArrayResult = any;
  export type QueryConfig = any;
  export type QueryParse = any;
  export type QueryResultBase = any;
  export type ResultBuilder = any;
  export type Submittable = any;
}

declare module "pg-protocol" {
  export class DatabaseError extends Error {
    severity?: string;
    code?: string;
    detail?: string;
    hint?: string;
    position?: string;
    internalPosition?: string;
    internalQuery?: string;
    where?: string;
    schema?: string;
    table?: string;
    column?: string;
    dataType?: string;
    constraint?: string;
    file?: string;
    line?: string;
    routine?: string;
    [key: string]: any;
  }
}
