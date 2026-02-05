(function (global) {
  "use strict";

  var CANONICAL_DIRECTIONS = ["UP", "RIGHT", "DOWN", "LEFT", "WAIT"];
  var DIRECTION_DELTAS = {
    UP: { dx: 0, dy: -1 },
    RIGHT: { dx: 1, dy: 0 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    WAIT: { dx: 0, dy: 0 }
  };

  function nowMs() {
    if (typeof performance !== "undefined" && performance && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  function toInt(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.trunc(n);
  }

  function clampMin(value, min) {
    return value < min ? min : value;
  }

  function pointFrom(value, fallbackX, fallbackY) {
    if (!value || typeof value !== "object") {
      return { x: fallbackX, y: fallbackY };
    }
    return {
      x: toInt(value.x, fallbackX),
      y: toInt(value.y, fallbackY)
    };
  }

  function keyOf(x, y) {
    return x + "," + y;
  }

  function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function normalizeLegalActions(input) {
    var raw = Array.isArray(input) ? input : CANONICAL_DIRECTIONS.slice();
    var out = [];
    for (var i = 0; i < raw.length; i += 1) {
      var action = String(raw[i] || "").toUpperCase();
      if (DIRECTION_DELTAS[action] && out.indexOf(action) === -1) {
        out.push(action);
      }
    }
    if (out.length === 0) {
      return CANONICAL_DIRECTIONS.slice();
    }
    return out;
  }

  function blockedToSet(blocked) {
    var set = new Set();
    if (!Array.isArray(blocked)) return set;

    for (var i = 0; i < blocked.length; i += 1) {
      var entry = blocked[i];
      var x;
      var y;
      if (Array.isArray(entry) && entry.length >= 2) {
        x = toInt(entry[0], NaN);
        y = toInt(entry[1], NaN);
      } else if (entry && typeof entry === "object") {
        x = toInt(entry.x, NaN);
        y = toInt(entry.y, NaN);
      }
      if (Number.isFinite(x) && Number.isFinite(y)) {
        set.add(keyOf(x, y));
      }
    }
    return set;
  }

  function normalizeState(state) {
    var safe = state && typeof state === "object" ? state : {};
    var grid = safe.grid && typeof safe.grid === "object" ? safe.grid : {};

    var width = clampMin(toInt(grid.width, 20), 1);
    var height = clampMin(toInt(grid.height, 15), 1);

    var me = pointFrom(safe.me || safe.opponent, 0, 0);
    me.x = Math.max(0, Math.min(width - 1, me.x));
    me.y = Math.max(0, Math.min(height - 1, me.y));

    var target = pointFrom(safe.target || safe.player, width - 1, height - 1);
    target.x = Math.max(0, Math.min(width - 1, target.x));
    target.y = Math.max(0, Math.min(height - 1, target.y));

    var maxDecisionMs = Number(safe.maxDecisionMs);
    if (!Number.isFinite(maxDecisionMs)) {
      maxDecisionMs = Number(safe.decisionBudgetMs);
    }
    if (!Number.isFinite(maxDecisionMs)) {
      maxDecisionMs = 2;
    }
    maxDecisionMs = Math.max(0.2, maxDecisionMs);

    return {
      width: width,
      height: height,
      blocked: blockedToSet(grid.blocked),
      legalActions: normalizeLegalActions(safe.legalActions),
      me: me,
      target: target,
      rngSeed: safe.rngSeed,
      maxDecisionMs: maxDecisionMs
    };
  }

  function isInside(cfg, x, y) {
    return x >= 0 && y >= 0 && x < cfg.width && y < cfg.height;
  }

  function isPassable(cfg, x, y) {
    return isInside(cfg, x, y) && !cfg.blocked.has(keyOf(x, y));
  }

  function toAction(direction) {
    return { type: "MOVE", direction: direction };
  }

  function isLegalAction(cfg, action) {
    if (!action || typeof action !== "object") return false;
    if (action.type !== "MOVE") return false;

    var direction = String(action.direction || "").toUpperCase();
    if (cfg.legalActions.indexOf(direction) === -1) return false;

    var delta = DIRECTION_DELTAS[direction];
    if (!delta) return false;

    if (direction === "WAIT") {
      return true;
    }

    var nx = cfg.me.x + delta.dx;
    var ny = cfg.me.y + delta.dy;
    return isPassable(cfg, nx, ny);
  }

  function fallbackAction(cfg) {
    if (cfg.legalActions.indexOf("WAIT") !== -1) {
      var waitAction = toAction("WAIT");
      if (isLegalAction(cfg, waitAction)) {
        return waitAction;
      }
    }

    for (var i = 0; i < cfg.legalActions.length; i += 1) {
      var candidate = toAction(cfg.legalActions[i]);
      if (isLegalAction(cfg, candidate)) {
        return candidate;
      }
    }

    return toAction("WAIT");
  }

  function hashSeed(seed) {
    var text = String(seed);
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function directionRankFactory(rngSeed) {
    var base = CANONICAL_DIRECTIONS.slice();
    if (rngSeed === undefined || rngSeed === null) {
      return function (dir) {
        var idx = base.indexOf(dir);
        return idx === -1 ? 999 : idx;
      };
    }

    var offset = hashSeed(rngSeed) % base.length;
    var rotated = [];
    for (var i = 0; i < base.length; i += 1) {
      rotated.push(base[(i + offset) % base.length]);
    }

    return function (dir) {
      var idx = rotated.indexOf(dir);
      return idx === -1 ? 999 : idx;
    };
  }

  function enumerateLegalDirections(cfg) {
    var out = [];
    for (var i = 0; i < cfg.legalActions.length; i += 1) {
      var dir = cfg.legalActions[i];
      var action = toAction(dir);
      if (isLegalAction(cfg, action)) {
        out.push(dir);
      }
    }
    return out;
  }

  function selectOpenNodeIndex(open, rankOfDirection) {
    var bestIndex = 0;
    for (var i = 1; i < open.length; i += 1) {
      var a = open[i];
      var b = open[bestIndex];

      if (a.f < b.f) {
        bestIndex = i;
      } else if (a.f === b.f) {
        if (a.h < b.h) {
          bestIndex = i;
        } else if (a.h === b.h) {
          if (a.g > b.g) {
            bestIndex = i;
          } else if (a.g === b.g) {
            var aRank = rankOfDirection(a.firstDirection || "WAIT");
            var bRank = rankOfDirection(b.firstDirection || "WAIT");
            if (aRank < bRank) {
              bestIndex = i;
            } else if (aRank === bRank) {
              if (a.y < b.y || (a.y === b.y && a.x < b.x)) {
                bestIndex = i;
              }
            }
          }
        }
      }
    }
    return bestIndex;
  }

  function aStarFirstDirection(cfg, legalDirections, rankOfDirection, deadline) {
    if (cfg.me.x === cfg.target.x && cfg.me.y === cfg.target.y) {
      return "WAIT";
    }

    var open = [];
    var gScore = new Map();
    var startKey = keyOf(cfg.me.x, cfg.me.y);

    open.push({
      x: cfg.me.x,
      y: cfg.me.y,
      g: 0,
      h: manhattan(cfg.me, cfg.target),
      f: manhattan(cfg.me, cfg.target),
      firstDirection: null
    });
    gScore.set(startKey, 0);

    var bestDirection = null;
    var bestDistance = manhattan(cfg.me, cfg.target);

    while (open.length > 0) {
      if (nowMs() >= deadline) {
        break;
      }

      var currentIndex = selectOpenNodeIndex(open, rankOfDirection);
      var current = open.splice(currentIndex, 1)[0];

      if (current.x === cfg.target.x && current.y === cfg.target.y) {
        return current.firstDirection || "WAIT";
      }

      if (current.firstDirection && current.h < bestDistance) {
        bestDistance = current.h;
        bestDirection = current.firstDirection;
      }

      for (var i = 0; i < CANONICAL_DIRECTIONS.length; i += 1) {
        var dir = CANONICAL_DIRECTIONS[i];
        if (dir === "WAIT") continue;
        if (legalDirections.indexOf(dir) === -1 && current.firstDirection === null) {
          continue;
        }

        var delta = DIRECTION_DELTAS[dir];
        var nx = current.x + delta.dx;
        var ny = current.y + delta.dy;
        var isTarget = nx === cfg.target.x && ny === cfg.target.y;

        if (!isTarget && !isPassable(cfg, nx, ny)) {
          continue;
        }

        var tentativeG = current.g + 1;
        var nKey = keyOf(nx, ny);
        var previousG = gScore.get(nKey);

        if (previousG !== undefined && tentativeG >= previousG) {
          continue;
        }

        gScore.set(nKey, tentativeG);

        var h = Math.abs(nx - cfg.target.x) + Math.abs(ny - cfg.target.y);
        var firstDirection = current.firstDirection || dir;

        open.push({
          x: nx,
          y: ny,
          g: tentativeG,
          h: h,
          f: tentativeG + h,
          firstDirection: firstDirection
        });
      }
    }

    return bestDirection;
  }

  function chooseGreedyDirection(cfg, legalDirections, rankOfDirection) {
    var bestDir = null;
    var bestDist = Infinity;

    for (var i = 0; i < legalDirections.length; i += 1) {
      var dir = legalDirections[i];
      if (dir === "WAIT") continue;

      var delta = DIRECTION_DELTAS[dir];
      var nx = cfg.me.x + delta.dx;
      var ny = cfg.me.y + delta.dy;
      var dist = Math.abs(nx - cfg.target.x) + Math.abs(ny - cfg.target.y);

      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dir;
      } else if (dist === bestDist && bestDir !== null) {
        if (rankOfDirection(dir) < rankOfDirection(bestDir)) {
          bestDir = dir;
        }
      }
    }

    if (bestDir) {
      return bestDir;
    }

    if (legalDirections.indexOf("WAIT") !== -1) {
      return "WAIT";
    }

    return legalDirections.length > 0 ? legalDirections[0] : "WAIT";
  }

  function chooseDirection(cfg) {
    var legalDirections = enumerateLegalDirections(cfg);
    if (legalDirections.length === 0) {
      return null;
    }

    var rankOfDirection = directionRankFactory(cfg.rngSeed);
    var start = nowMs();
    var budget = cfg.maxDecisionMs;
    var deadline = start + Math.max(0.1, budget - 0.05);

    var aStarDirection = aStarFirstDirection(cfg, legalDirections, rankOfDirection, deadline);
    if (aStarDirection && legalDirections.indexOf(aStarDirection) !== -1) {
      return aStarDirection;
    }

    return chooseGreedyDirection(cfg, legalDirections, rankOfDirection);
  }

  function decideAction(state) {
    var cfg = normalizeState(state);
    var direction = chooseDirection(cfg);

    if (!direction) {
      return fallbackAction(cfg);
    }

    var action = toAction(direction);
    if (!isLegalAction(cfg, action)) {
      return fallbackAction(cfg);
    }

    return action;
  }

  var api = { decideAction: decideAction };
  global.GridChaseAI = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
