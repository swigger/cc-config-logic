import {
    dirname as R02,
    join as D81,
    resolve as Q81
} from "path";
import {
    cwd as wk0
} from "process";
import * as TQ from "fs";
import {
    join as rx9
} from "path";
import {
    join as gG0
} from "path";
import {
    join as s12
} from "path";
import {
    homedir as ox9
} from "os";
import {
    randomUUID as $k0
} from "crypto";
import {
    homedir as $i4
} from "os";
import {
    execSync as ki4
} from "child_process";

import {
    resolve as QN2,
    dirname as ZN2,
    normalize as Si4,
    join as y51
} from "path";


import pkg from "lodash";
const memoize = pkg.memoize;
const cloneDeep = pkg.cloneDeep;
import * as dL from "@sentry/node";
import * as h from "zod";



var CP = {
        allowedTools: [],
        history: [],
        mcpContextUris: [],
        mcpServers: {},
        enabledMcpjsonServers: [],
        disabledMcpjsonServers: [],
        hasTrustDialogAccepted: !1,
        ignorePatterns: [],
        projectOnboardingSeenCount: 0,
        hasClaudeMdExternalIncludesApproved: !1,
        hasClaudeMdExternalIncludesWarningShown: !1
    },
    fV = {
        numStartups: 0,
        installMethod: void 0,
        autoUpdates: void 0,
        theme: "dark",
        preferredNotifChannel: "auto",
        verbose: !1,
        editorMode: "normal",
        autoCompactEnabled: !0,
        hasSeenTasksHint: !1,
        queuedCommandUpHintCount: 0,
        diffTool: "auto",
        customApiKeyResponses: {
            approved: [],
            rejected: []
        },
        env: {},
        tipsHistory: {},
        memoryUsageCount: 0,
        promptQueueUseCount: 0,
        todoFeatureEnabled: !0,
        messageIdleNotifThresholdMs: 60000,
        autoConnectIde: !1,
        autoInstallIdeExtension: !0,
        autocheckpointingEnabled: !0,
        cachedStatsigGates: {}
    };

var isConfigInitialized = !1;

function initializeConfigSystem() {
    if (isConfigInitialized) return;
    isConfigInitialized = !0, x_(vY(), fV, !0)
}

function getCurrentWorkingDirectory() {
    return i2.cwd
}

function getCurrentWorkingDirectoryWrapper() {
    return getCurrentWorkingDirectory()
}

function getCurrentDirectoryWithFallback() {
    try {
        return getCurrentWorkingDirectoryWrapper()
    } catch {
        return getOriginalCwd()
    }
}

var gitRepositoryRoot = memoize(() => {
    let A = getOriginalCwd();
    try {
        return Si4(ki4("git rev-parse --show-toplevel", {
            cwd: A,
            encoding: "utf8",
            stdio: ["pipe", "pipe", "ignore"]
        }).trim())
    } catch {
        return QN2(A)
    }
});

function getProjectConfig() {
    let A = gitRepositoryRoot(),
        B = x_(vY(), fV);
    if (!B.projects) return CP;
    let Q = B.projects[A] ?? CP;
    if (typeof Q.allowedTools === "string") Q.allowedTools = T7(Q.allowedTools) ?? [];
    return Q
}
var W40 = h.enum(["local", "user", "project", "dynamic"]),
    LC5 = h.enum(["stdio", "sse", "sse-ide", "http"]),
    J40 = h.object({
        type: h.literal("stdio").optional(),
        command: h.string().min(1, "Command cannot be empty"),
        args: h.array(h.string()).default([]),
        env: h.record(h.string()).optional()
    }),
    sD4 = h.object({
        type: h.literal("sse"),
        url: h.string(),
        headers: h.record(h.string()).optional()
    }),
    rD4 = h.object({
        type: h.literal("sse-ide"),
        url: h.string(),
        ideName: h.string(),
        ideRunningInWindows: h.boolean().optional()
    }),
    oD4 = h.object({
        type: h.literal("ws-ide"),
        url: h.string(),
        ideName: h.string(),
        authToken: h.string().optional(),
        ideRunningInWindows: h.boolean().optional()
    }),
    tD4 = h.object({
        type: h.literal("http"),
        url: h.string(),
        headers: h.record(h.string()).optional()
    }),
    X40 = h.union([J40, sD4, rD4, oD4, tD4]);
var beA = h.object({
    mcpServers: h.record(h.string(), X40)
});

function t61(A) {
    let {
        configObject: B,
        expandVars: Q,
        scope: Z,
        filePath: D
    } = A, G = beA.safeParse(B);
    if (!G.success) return {
        config: null,
        errors: G.error.issues.map((Y) => ({
            ...D && {
                file: D
            },
            path: Y.path.join("."),
            message: "Does not adhere to MCP server configuration schema",
            mcpErrorMetadata: {
                scope: Z,
                severity: "fatal"
            }
        }))
    };
    let F = [],
        I = {};
    for (let [Y, W] of Object.entries(G.data.mcpServers)) {
        let J = W;
        if (Q) {
            let {
                expanded: X,
                missingVars: V
            } = _G4(W);
            if (V.length > 0) F.push({
                ...D && {
                    file: D
                },
                path: `mcpServers.${Y}`,
                message: `Missing environment variables: ${V.join(", ")}`,
                suggestion: `Set the following environment variables: ${V.join(", ")}`,
                mcpErrorMetadata: {
                    scope: Z,
                    serverName: Y,
                    severity: "warning"
                }
            });
            J = X
        }
        if (L9() === "windows" && (!J.type || J.type === "stdio") && (J.command === "npx" || J.command.endsWith("\\npx") || J.command.endsWith("/npx"))) F.push({
            ...D && {
                file: D
            },
            path: `mcpServers.${Y}`,
            message: "Windows requires 'cmd /c' wrapper to execute npx",
            suggestion: 'Change command to "cmd" with args ["/c", "npx", ...]. See: https://docs.anthropic.com/en/docs/claude-code/mcp#configure-mcp-servers',
            mcpErrorMetadata: {
                scope: Z,
                serverName: Y,
                severity: "warning"
            }
        });
        I[Y] = J
    }
    return {
        config: {
            mcpServers: I
        },
        errors: F
    }
}


function f40(A, B) {
    if (!A) return {};
    let Q = {};
    for (let [Z, D] of Object.entries(A)) Q[Z] = {
        ...D,
        scope: B
    };
    return Q
}

function ZG(A) {
    switch (A) {
        case "project": {
            let B = s12(getCurrentDirectoryWithFallback(), ".mcp.json");
            if (!j1().existsSync(B)) return {
                servers: {},
                errors: []
            };
            let {
                config: Z,
                errors: D
            } = g40({
                filePath: B,
                expandVars: !0,
                scope: "project"
            });
            return {
                servers: f40(Z?.mcpServers, A),
                errors: D
            }
        }
        case "user": {
            let B = H0().mcpServers;
            if (!B) return {
                servers: {},
                errors: []
            };
            let {
                config: Q,
                errors: Z
            } = t61({
                configObject: {
                    mcpServers: B
                },
                expandVars: !0,
                scope: "user"
            });
            return {
                servers: f40(Q?.mcpServers, A),
                errors: Z
            }
        }
        case "local": {
            let B = getProjectConfig().mcpServers;
            if (!B) return {
                servers: {},
                errors: []
            };
            let {
                config: Q,
                errors: Z
            } = t61({
                configObject: {
                    mcpServers: B
                },
                expandVars: !0,
                scope: "local"
            });
            return {
                servers: f40(Q?.mcpServers, A),
                errors: Z
            }
        }
    }
}


var In1 = ["macos", "wsl"],
    L9 = memoize(() => {
        try {
            if (process.platform === "darwin") return "macos";
            if (process.platform === "win32") return "windows";
            if (process.platform === "linux") {
                try {
                    let A = j1().readFileSync("/proc/version", {
                        encoding: "utf8"
                    });
                    if (A.toLowerCase().includes("microsoft") || A.toLowerCase().includes("wsl")) return "wsl"
                } catch (A) {
                    R1(A instanceof Error ? A : new Error(String(A)))
                }
                return "linux"
            }
            return "unknown"
        } catch (A) {
            return R1(A instanceof Error ? A : new Error(String(A))), "unknown"
        }
    });

function mg() {
    switch (L9()) {
        case "macos":
            return "/Library/Application Support/ClaudeCode";
        case "windows":
            return "C:\\ProgramData\\ClaudeCode";
        default:
            return "/etc/claude-code"
    }
}

var Dv9 = {
        accessSync(A, B) {
            TQ.accessSync(A, B)
        },
        cwd() {
            return process.cwd()
        },
        chmodSync(A, B) {
            TQ.chmodSync(A, B)
        },
        existsSync(A) {
            return TQ.existsSync(A)
        },
        async stat(A) {
            return Zv9(A)
        },
        statSync(A) {
            return TQ.statSync(A)
        },
        readFileSync(A, B) {
            return TQ.readFileSync(A, {
                encoding: B.encoding
            })
        },
        readFileBytesSync(A) {
            return TQ.readFileSync(A)
        },
        readSync(A, B) {
            let Q = void 0;
            try {
                Q = TQ.openSync(A, "r");
                let Z = Buffer.alloc(B.length),
                    D = TQ.readSync(Q, Z, 0, B.length, 0);
                return {
                    buffer: Z,
                    bytesRead: D
                }
            } finally {
                if (Q) TQ.closeSync(Q)
            }
        },
        writeFileSync(A, B, Q) {
            if (!Q.flush) {
                TQ.writeFileSync(A, B, {
                    encoding: Q.encoding
                });
                return
            }
            let Z;
            try {
                Z = TQ.openSync(A, "w"), TQ.writeFileSync(Z, B, {
                    encoding: Q.encoding
                }), TQ.fsyncSync(Z)
            } finally {
                if (Z) TQ.closeSync(Z)
            }
        },
        appendFileSync(A, B) {
            TQ.appendFileSync(A, B)
        },
        copyFileSync(A, B) {
            TQ.copyFileSync(A, B)
        },
        unlinkSync(A) {
            TQ.unlinkSync(A)
        },
        renameSync(A, B) {
            TQ.renameSync(A, B)
        },
        symlinkSync(A, B) {
            TQ.symlinkSync(A, B)
        },
        readlinkSync(A) {
            return TQ.readlinkSync(A)
        },
        realpathSync(A) {
            return TQ.realpathSync(A)
        },
        mkdirSync(A) {
            if (!TQ.existsSync(A)) TQ.mkdirSync(A, {
                recursive: !0
            })
        },
        readdirSync(A) {
            return TQ.readdirSync(A, {
                withFileTypes: !0
            })
        },
        readdirStringSync(A) {
            return TQ.readdirSync(A)
        },
        isDirEmptySync(A) {
            return this.readdirSync(A).length === 0
        },
        rmdirSync(A) {
            TQ.rmdirSync(A)
        },
        rmSync(A, B) {
            TQ.rmSync(A, B)
        }
    },
    Gv9 = Dv9;
var Z81 = null;
var uw = ["userSettings", "projectSettings", "localSettings", "flagSettings", "policySettings"];

function j1() {
    return Gv9
}

var Ha = memoize((A) => {
    let B = jo(),
        Q = H0(),
        Z = "",
        D = 0;
    if (A) {
        if (Z = __() ?? "", Z !== "" && Q.claudeCodeFirstTokenDate) {
            let G = new Date(Q.claudeCodeFirstTokenDate).getTime();
            if (!isNaN(G)) D = G
        }
    }
    return {
        customIDs: {
            sessionId: CB(),
            organizationUUID: Q.oauthAccount?.organizationUuid
        },
        userID: B,
        appVersion: {
            ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
            PACKAGE_URL: "@anthropic-ai/claude-code",
            README_URL: "https://docs.anthropic.com/s/claude-code",
            VERSION: "1.0.83"
        }.VERSION,
        email: Ci4(),
        custom: {
            userType: "external",
            organizationUuid: Q.oauthAccount?.organizationUuid,
            accountUuid: Q.oauthAccount?.accountUuid,
            subscriptionType: Z,
            firstTokenTime: D,
            ...process.env.GITHUB_ACTIONS === "true" && {
                githubActor: process.env.GITHUB_ACTOR,
                githubActorId: process.env.GITHUB_ACTOR_ID,
                githubRepositoryId: process.env.GITHUB_REPOSITORY_ID,
                githubRepositoryOwner: process.env.GITHUB_REPOSITORY_OWNER,
                githubRepositoryOwnerId: process.env.GITHUB_REPOSITORY_OWNER_ID
            }
        }
    }
});

function MR1(A) {
    try {
        let B = Ha();
        dL.setTags({
            platform: sA.platform,
            terminal: sA.terminal,
            userType: "external",
            ...y_A()
        }), dL.setExtras({
            sessionId: CB(),
            isCI: sA.isCI,
            isTest: !1,
            packageVersion: {
                ISSUES_EXPLAINER: "report the issue at https://github.com/anthropics/claude-code/issues",
                PACKAGE_URL: "@anthropic-ai/claude-code",
                README_URL: "https://docs.anthropic.com/s/claude-code",
                VERSION: "1.0.83"
            }.VERSION
        }), dL.setUser({
            id: B.userID,
            email: B.email
        }), dL.captureException(A)
    } catch {}
}

var vG0 = !1;

function R1(A) {
    if (vG0) return;
    vG0 = !0;
    try {
        if (process.env.CLAUDE_CODE_USE_BEDROCK || process.env.CLAUDE_CODE_USE_VERTEX || process.env.DISABLE_ERROR_REPORTING || process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) return;
        if (IQ(!1)) console.error(A);
        let B = A.stack || A.message,
            Q = {
                error: B,
                timestamp: new Date().toISOString()
            };
        if (RR1.length >= Hi4) RR1.shift();
        RR1.push(Q), Ui4(Ei4(), {
            error: B
        })
    } catch {} finally {
        vG0 = !1
    }
    MR1(A)
}

function uF4(A, B) {
    if (typeof A === "object" && A && "code" in A && A.code === "ENOENT") n1(`Broken symlink or missing file encountered for settings.json at path: ${B}`);
    else R1(A instanceof Error ? A : new Error(String(A)))
}

function T02(A, B) {
    let Q = j1();
    if (!Q.existsSync(A)) return {
        settings: null,
        errors: []
    };
    try {
        let {
            resolvedPath: Z
        } = XV(Q, A), D = AX(Z);
        if (D.trim() === "") return {
            settings: {},
            errors: []
        };
        let G = T7(D),
            F = us.safeParse(G);
        if (!F.success) return gF4(B, F.error), {
            settings: null,
            errors: v40(F.error, A)
        };
        return {
            settings: F.data,
            errors: []
        }
    } catch (Z) {
        return uF4(Z, A), {
            settings: null,
            errors: []
        }
    }
}

function Lm1() {
    return i2.flagSettingsPath
}

function fF4() {
    return D81(mg(), "managed-settings.json")
}

function getOriginalCwd() {
    return i2.originalCwd
}

function Rq1(A) {
    switch (A) {
        case "userSettings":
            return Q81(e9());
        case "policySettings":
        case "projectSettings":
        case "localSettings":
            return Q81(getOriginalCwd());
        case "flagSettings": {
            let B = Lm1();
            return B ? R02(Q81(B)) : Q81(getOriginalCwd())
        }
    }
}

function G81(A) {
    switch (A) {
        case "projectSettings":
            return D81(".claude", "settings.json");
        case "localSettings":
            return D81(".claude", "settings.local.json")
    }
}

function RT(A) {
    switch (A) {
        case "userSettings":
            return D81(Rq1(A), "settings.json");
        case "projectSettings":
        case "localSettings":
            return D81(Rq1(A), G81(A));
        case "policySettings":
            return fF4();
        case "flagSettings":
            return Lm1()
    }
}

function dF4() {
    let A = {},
        B = [],
        Q = new Set,
        Z = new Set;
    for (let G of uw) {
        let F = RT(G);
        if (!F) continue;
        let I = Q81(F);
        if (Z.has(I)) continue;
        Z.add(I);
        let {
            settings: Y,
            errors: W
        } = T02(F, G);
        for (let J of W) {
            let X = `${J.file}:${J.path}:${J.message}`;
            if (!Q.has(X)) Q.add(X), B.push(J)
        }
        if (Y) A = _W1(A, Y, (J, X) => {
            if (Array.isArray(J) && Array.isArray(X)) return mF4(J, X);
            return
        })
    }
    let D = ["user", "project", "local"];
    return B.push(...D.flatMap((G) => ZG(G).errors)), {
        settings: A,
        errors: B
    }
}

function qL() {
    if (Z81 !== null) return Z81;
    return Z81 = dF4(), Z81
}

function GB() {
    let {
        settings: A
    } = qL();
    return A || {}
}

function IQ(A) {
    if (!A) return !1;
    let B = A.toLowerCase().trim();
    return ["1", "true", "yes", "on"].includes(B)
}

function ytB() {
    return {
        originalCwd: wk0(),
        totalCostUSD: 0,
        totalAPIDuration: 0,
        totalAPIDurationWithoutRetries: 0,
        startTime: Date.now(),
        lastInteractionTime: Date.now(),
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
        hasUnknownModelCost: !1,
        cwd: wk0(),
        modelUsage: {},
        mainLoopModelOverride: void 0,
        maxRateLimitFallbackActive: !1,
        initialMainLoopModel: null,
        modelStrings: null,
        isNonInteractiveSession: !0,
        isInteractive: !1,
        clientType: "cli",
        flagSettingsPath: void 0,
        meter: null,
        sessionCounter: null,
        locCounter: null,
        prCounter: null,
        commitCounter: null,
        costCounter: null,
        tokenCounter: null,
        codeEditToolDecisionCounter: null,
        activeTimeCounter: null,
        sessionId: $k0(),
        loggerProvider: null,
        eventLogger: null,
        agentColorMap: new Map,
        agentColorIndex: 0,
        backgroundShells: new Map,
        backgroundShellCounter: 0,
        backgroundShellSubscribers: new Set
    }
}

var i2 = ytB();

function Nl() {
    return i2.isNonInteractiveSession
}

function mG0(A) {
    if (A.installMethod !== void 0) return A;
    let B = "unknown",
        Q = A.autoUpdates ?? !0;
    switch (A.autoUpdaterStatus) {
        case "migrated":
            B = "local";
            break;
        case "installed":
            B = "native";
            break;
        case "disabled":
            Q = !1;
            break;
        case "enabled":
        case "no_permissions":
        case "not_configured":
            B = "global";
            break;
        case void 0:
            break
    }
    return {
        ...A,
        installMethod: B,
        autoUpdates: Q
    }
}

function e9() {
    return process.env.CLAUDE_CONFIG_DIR ?? rx9(ox9(), ".claude")
}

function x_(A, B, Q) {
    if (!isConfigInitialized) throw new Error("Config accessed before allowed.");
    let Z = j1();
    if (!Z.existsSync(A)) {
        let D = `${A}.backup`;
        if (Z.existsSync(D)) process.stdout.write(`
Claude configuration file not found at: ${A}
A backup file exists at: ${D}
You can manually restore it by running: cp "${D}" "${A}"

`);
        return cloneDeep(B)
    }
    try {
        let D = Z.readFileSync(A, {
            encoding: "utf-8"
        });
        try {
            let G = JSON.parse(D);
            return {
                ...cloneDeep(B),
                ...G
            }
        } catch (G) {
            let F = G instanceof Error ? G.message : String(G);
            throw new Rg(F, A, B)
        }
    } catch (D) {
        if (D instanceof Rg && Q) throw D;
        if (D instanceof Rg) {
            SA(`Config file corrupted, resetting to defaults: ${D.message}`), R1(D), process.stdout.write(`
Claude configuration file at ${A} is corrupted: ${D.message}
`);
            let G = `${A}.corrupted.${Date.now()}`;
            try {
                Z.copyFileSync(A, G), SA(`Corrupted config backed up to: ${G}`)
            } catch {}
            let F = `${A}.backup`;
            if (process.stdout.write(`
Claude configuration file at ${A} is corrupted
The corrupted file has been backed up to: ${G}
`), Z.existsSync(F)) process.stdout.write(`A backup file exists at: ${F}
You can manually restore it by running: cp "${F}" "${A}"

`);
            else process.stdout.write(`
`)
        }
        return cloneDeep(B)
    }
}
class Rg extends Error {
    filePath;
    defaultConfig;
    constructor(A, B, Q) {
        super(A);
        this.name = "ConfigParseError", this.filePath = B, this.defaultConfig = Q
    }
}

function vY() {
    if (j1().existsSync(gG0(e9(), ".config.json"))) return gG0(e9(), ".config.json");
    return gG0(process.env.CLAUDE_CONFIG_DIR || $i4(), ".claude.json")
}

function H0() {
    try {
        let A = j1().existsSync(vY()) ? j1().statSync(vY()) : null;
        if (VP.config && A) {
            if (A.mtimeMs <= VP.mtime) return VP.config
        }
        let B = mG0(x_(vY(), fV));
        if (A) VP = {
            config: B,
            mtime: A.mtimeMs
        };
        else VP = {
            config: B,
            mtime: Date.now()
        };
        return mG0(B)
    } catch {
        return mG0(x_(vY(), fV))
    }
}

var P51 = memoize(() => {
    if (process.platform === "darwin") {
        let B = I81();
        try {
            let Q = zZ(`security find-generic-password -a $USER -w -s "${B}"`);
            if (Q) return {
                key: Q,
                source: "/login managed key"
            }
        } catch (Q) {
            R1(Q)
        }
    }
    let A = H0();
    if (!A.primaryApiKey) return null;
    return {
        key: A.primaryApiKey,
        source: "/login managed key"
    }
});

import {
    exec as Di4
} from "child_process";
var Gi4 = 300000;


var HC1 = "user:inference";

function TT(A) {
    return Boolean(A?.includes(HC1))
}

function Ii4() {
    let A = process.env.CLAUDE_CODE_API_KEY_HELPER_TTL_MS;
    if (A) {
        let B = parseInt(A, 10);
        if (!Number.isNaN(B) && B >= 0) return B;
        SA(`Found CLAUDE_CODE_API_KEY_HELPER_TTL_MS env var, but it was not a valid number. Got ${A}`)
    }
    return Gi4
}

function C20(A, B = 300000) {
    let Q = new Map,
        Z = (...D) => {
            let G = JSON.stringify(D),
                F = Q.get(G),
                I = Date.now();
            if (!F) Q.set(G, {
                value: A(...D),
                timestamp: I,
                refreshing: !1
            });
            if (F && I - F.timestamp > B && !F.refreshing) return F.refreshing = !0, Promise.resolve().then(() => {
                let Y = A(...D);
                Q.set(G, {
                    value: Y,
                    timestamp: Date.now(),
                    refreshing: !1
                })
            }).catch((Y) => {
                R1(Y instanceof Error ? Y : new Error(String(Y)));
                let W = Q.get(G);
                if (W) W.refreshing = !1
            }), F.value;
            return Q.get(G).value
        };
    return Z.cache = {
        clear: () => Q.clear()
    }, Z
}

var Mu = C20(() => {
    let B = (GB() || {}).apiKeyHelper;
    if (!B) return null;
    try {
        let Q = zZ(B)?.toString().trim();
        if (!Q) throw new Error("apiKeyHelper did not return a valid value");
        return Q
    } catch (Q) {
        let Z = e1.red("Error getting API key from apiKeyHelper (in settings or ~/.claude.json):");
        if (Q instanceof Error && "stderr" in Q) console.error(Z, String(Q.stderr));
        else if (Q instanceof Error) console.error(Z, Q.message);
        else console.error(Z, Q);
        return " "
    }
}, Ii4());

function DX(A) {
    if (A && process.env.ANTHROPIC_API_KEY) return {
        key: process.env.ANTHROPIC_API_KEY,
        source: "ANTHROPIC_API_KEY"
    };
    if (IQ(!1)) {
        if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_CODE_OAUTH_TOKEN) throw new Error("ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN env var is required");
        if (process.env.ANTHROPIC_API_KEY) return {
            key: process.env.ANTHROPIC_API_KEY,
            source: "ANTHROPIC_API_KEY"
        };
        return {
            key: null,
            source: "none"
        }
    }
    if (process.env.ANTHROPIC_API_KEY && H0().customApiKeyResponses?.approved?.includes(xK(process.env.ANTHROPIC_API_KEY))) return {
        key: process.env.ANTHROPIC_API_KEY,
        source: "ANTHROPIC_API_KEY"
    };
    let B = Mu();
    if (B) return {
        key: B,
        source: "apiKeyHelper"
    };
    let Q = P51();
    if (Q) return Q;
    return {
        key: null,
        source: "none"
    }
}
import {
    join as lF4
} from "path";

function r40() {
    let A = e9(),
        B = ".credentials.json",
        Q = lF4(A, ".credentials.json");
    return {
        name: "plaintext",
        read() {
            if (j1().existsSync(Q)) try {
                let Z = j1().readFileSync(Q, {
                    encoding: "utf8"
                });
                return JSON.parse(Z)
            } catch (Z) {
                return null
            }
            return null
        },
        update(Z) {
            try {
                if (!j1().existsSync(A)) j1().mkdirSync(A);
                return j1().writeFileSync(Q, JSON.stringify(Z), {
                    encoding: "utf8",
                    flush: !1
                }), j1().chmodSync(Q, 384), {
                    success: !0,
                    warning: "Warning: Storing credentials in plaintext."
                }
            } catch (D) {
                return {
                    success: !1
                }
            }
        },
        delete() {
            if (j1().existsSync(Q)) try {
                return j1().unlinkSync(Q), !0
            } catch (Z) {
                return !1
            }
            return !0
        }
    }
}

function wK() {
    if (process.platform === "darwin") {
        let A = P02(),
            B = r40();
        return pF4(A, B)
    }
    return r40()
}

function getOAuthCredentials() {
    if (process.env.CLAUDE_CODE_OAUTH_TOKEN) return {
        accessToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
        refreshToken: null,
        expiresAt: null,
        scopes: ["user:inference"],
        subscriptionType: null
    };
    try {
        let Q = wK().read()?.claudeAiOauth;
        if (!Q?.accessToken) return null;
        if (!Q.subscriptionType) {
            let Z = Q.isMax === !1 ? "pro" : "max";
            return {
                ...Q,
                subscriptionType: Z
            }
        }
        return Q
    } catch (A) {
        return R1(A), null
    }
}

function KE() {
    let A = IQ(process.env.CLAUDE_CODE_USE_BEDROCK) || IQ(process.env.CLAUDE_CODE_USE_VERTEX),
        Q = (GB() || {}).apiKeyHelper,
        Z = process.env.ANTHROPIC_AUTH_TOKEN || Q,
        {
            source: D
        } = DX(Nl());
    return !(A || Z || (D === "ANTHROPIC_API_KEY" || D === "apiKeyHelper"))
}

function isOAuthRequired() {
    if (!KE()) return !1;
    return TT(getOAuthCredentials()?.scopes)
}
console.log("========");
initializeConfigSystem();
console.log(getOAuthCredentials());
console.log(isOAuthRequired());