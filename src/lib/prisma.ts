import path from "path";
import fs from "fs";

// If running on Linux/Vercel cloud, purge any Windows query engine library env vars
if (process.platform !== "win32") {
  delete process.env.PRISMA_QUERY_ENGINE_LIBRARY;
} else {
  // Point explicitly to matching Prisma query engine binary on Windows local dev
  try {
    const enginesDir = path.resolve(process.cwd(), "node_modules/@prisma/engines");
    const engineSrc = path.join(enginesDir, "query_engine-windows.dll.node");
    const clientDir = path.resolve(process.cwd(), "node_modules/.prisma/client");
    const engineDest = path.join(clientDir, "query_engine-windows.dll.node");

    if (fs.existsSync(engineSrc)) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = engineSrc;
      if (fs.existsSync(engineDest)) {
        const srcStat = fs.statSync(engineSrc);
        const destStat = fs.statSync(engineDest);
        if (srcStat.size !== destStat.size) {
          try {
            fs.copyFileSync(engineSrc, engineDest);
          } catch {}
        }
      }
    }
  } catch {}
}

import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import http from "http";

class HttpProxyAgent extends http.Agent {
  private proxyUrl: URL;

  constructor(proxyUrl: string) {
    super({ keepAlive: false });
    this.proxyUrl = new URL(proxyUrl);
  }

  createConnection(options: any, callback?: any): any {
    const port = options.port || 443;
    const host = options.host || options.hostname;

    const connectReq = http.request({
      host: this.proxyUrl.hostname,
      port: Number(this.proxyUrl.port) || 8080,
      method: "CONNECT",
      path: `${host}:${port}`,
      headers: {
        Host: `${host}:${port}`,
      },
    });

    connectReq.on("connect", (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        return callback?.(new Error(`Proxy returned status ${res.statusCode}`));
      }
      return callback?.(null, socket);
    });

    connectReq.on("error", (err) => {
      callback?.(err);
    });

    connectReq.end();
    return undefined;
  }
}

const proxyStr = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyStr) {
  const proxyAgent = new HttpProxyAgent(proxyStr);
  class ProxiedWebSocket extends ws {
    constructor(address: any, protocols: any, options: any) {
      super(address, protocols, { ...options, agent: proxyAgent });
    }
  }
  neonConfig.webSocketConstructor = ProxiedWebSocket as any;
} else {
  neonConfig.webSocketConstructor = ws;
}

// Polyfill executeScript for Prisma 6 query engine driver adapter compatibility
if (!(PrismaNeon.prototype as any).executeScript) {
  (PrismaNeon.prototype as any).executeScript = async function (script: string) {
    try {
      await (this as any).client.query(script);
      return {
        ok: true,
        value: undefined,
        map: (fn: any) => ({ ok: true, value: fn(undefined) }),
        flatMap: (fn: any) => fn(undefined),
      };
    } catch (e: any) {
      return {
        ok: false,
        error: e,
        map: () => ({ ok: false, error: e }),
        flatMap: () => ({ ok: false, error: e }),
      };
    }
  };
}

// Polyfill startTransaction on PrismaNeon prototype for Prisma engine compatibility
if (!(PrismaNeon.prototype as any).startTransaction) {
  (PrismaNeon.prototype as any).startTransaction = async function (...args: any[]) {
    try {
      const ctxResult = await (this as any).transactionContext();
      if (!ctxResult.ok) return ctxResult;
      return await ctxResult.value.startTransaction(...args);
    } catch (e: any) {
      return {
        ok: false,
        error: e,
        map: () => ({ ok: false, error: e }),
        flatMap: () => ({ ok: false, error: e }),
      };
    }
  };
}

// Polyfill dispose for Prisma engine compatibility
if (!(PrismaNeon.prototype as any).dispose) {
  (PrismaNeon.prototype as any).dispose = async function () {
    if (typeof (this as any).close === "function") {
      return (this as any).close();
    }
    return { ok: true, value: undefined };
  };
}

let _reqCount = 1n;
function getPrismaReqId() {
  return String(_reqCount++);
}

export function wrapNativeEngineInstance(nativeEngine: any) {
  if (!nativeEngine || nativeEngine._wrappedForPrisma6) return;
  nativeEngine._wrappedForPrisma6 = true;

  const origConnect = nativeEngine.connect.bind(nativeEngine);
  nativeEngine.connect = async (...args: any[]) => {
    const reqId = getPrismaReqId();
    if (args.length < 2) return origConnect(args[0] || "{}", reqId);
    return origConnect(...args);
  };

  const origDisconnect = nativeEngine.disconnect.bind(nativeEngine);
  nativeEngine.disconnect = async (...args: any[]) => {
    const reqId = getPrismaReqId();
    if (args.length < 2) return origDisconnect(args[0] || "{}", reqId);
    return origDisconnect(...args);
  };

  const origQuery = nativeEngine.query.bind(nativeEngine);
  nativeEngine.query = async (...args: any[]) => {
    const reqId = getPrismaReqId();
    if (args.length === 2) return origQuery(args[0], args[1] || "{}", undefined, reqId);
    if (args.length === 3) return origQuery(args[0], args[1] || "{}", args[2], reqId);
    return origQuery(...args);
  };

  const origStartTx = nativeEngine.startTransaction.bind(nativeEngine);
  nativeEngine.startTransaction = async (...args: any[]) => {
    const reqId = getPrismaReqId();
    if (args.length < 3) return origStartTx(args[0], args[1] || "{}", reqId);
    return origStartTx(...args);
  };

  const origCommitTx = nativeEngine.commitTransaction.bind(nativeEngine);
  nativeEngine.commitTransaction = async (...args: any[]) => {
    const reqId = getPrismaReqId();
    if (args.length < 3) return origCommitTx(args[0], args[1] || "{}", reqId);
    return origCommitTx(...args);
  };

  const origRollbackTx = nativeEngine.rollbackTransaction.bind(nativeEngine);
  nativeEngine.rollbackTransaction = async (...args: any[]) => {
    const reqId = getPrismaReqId();
    if (args.length < 3) return origRollbackTx(args[0], args[1] || "{}", reqId);
    return origRollbackTx(...args);
  };
}

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || "";
  const pool = new (Pool as any)({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }) as Pool;
  pool.on("error", (err: any) => {
    // Gracefully handle idle connection drop without crashing the process
    console.warn("Neon pool idle connection warning:", err?.message);
  });

  const adapter = new PrismaNeon(pool, { schema: "public" }) as any;
  adapter.getConnectionInfo = () => ({
    ok: true,
    value: {
      schemaName: "public",
      maxBindValues: 65535,
      supportsRelationJoins: false,
    },
    schemaName: "public",
    maxBindValues: 65535,
    supportsRelationJoins: false,
  });

  if (typeof adapter.executeScript !== "function") {
    adapter.executeScript = async (script: string) => {
      try {
        await pool.query(script);
        return { ok: true, value: undefined };
      } catch (e: any) {
        return { ok: false, error: e };
      }
    };
  }

  if (typeof adapter.startTransaction !== "function") {
    adapter.startTransaction = async (...args: any[]) => {
      try {
        const ctxResult = await adapter.transactionContext();
        if (!ctxResult.ok) return ctxResult;
        return await ctxResult.value.startTransaction(...args);
      } catch (e: any) {
        return {
          ok: false,
          error: e,
          map: () => ({ ok: false, error: e }),
          flatMap: () => ({ ok: false, error: e }),
        };
      }
    };
  }

  if (typeof adapter.dispose !== "function") {
    adapter.dispose = async () => {
      if (typeof adapter.close === "function") {
        return adapter.close();
      }
      return { ok: true, value: undefined };
    };
  }

  const client = new PrismaClient({
    adapter: adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  } as any);

  // Hook into client's engine when initialized
  const engineWrapper = (client as any)._engine;
  if (engineWrapper) {
    const patchCurrentEngine = () => {
      if (engineWrapper.engine) {
        wrapNativeEngineInstance(engineWrapper.engine);
      }
    };

    patchCurrentEngine();

    const origInstantiate = engineWrapper.instantiateLibrary?.bind(engineWrapper);
    if (origInstantiate) {
      engineWrapper.instantiateLibrary = async function (...args: any[]) {
        const res = await origInstantiate(...args);
        patchCurrentEngine();
        return res;
      };
    }

    const origStart = engineWrapper.start?.bind(engineWrapper);
    if (origStart) {
      engineWrapper.start = async function (...args: any[]) {
        if (!engineWrapper.engine && engineWrapper.instantiateLibrary) {
          await engineWrapper.instantiateLibrary();
        }
        patchCurrentEngine();
        return origStart(...args);
      };
    }
  }

  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
  var __prisma_version: undefined | number;
}

// Increment version to discard any stale singleton cached in Node.js dev server memory
const CURRENT_PRISMA_VERSION = 4;

export const prisma =
  globalThis.__prisma_version === CURRENT_PRISMA_VERSION && globalThis.prisma
    ? globalThis.prisma
    : prismaClientSingleton();

globalThis.__prisma_version = CURRENT_PRISMA_VERSION;
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
