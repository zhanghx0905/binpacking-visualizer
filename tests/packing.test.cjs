const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

// Exercise the actual browser modules with their @/ imports, without adding
// a test framework or generating files in src.
const cache = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, "../src", `${relative}.ts`);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  new Function("require", "module", "exports", outputText)(
    (name) => name.startsWith("@/") ? load(name.slice(2)) : require(name),
    loadedModule, loadedModule.exports,
  );
  return loadedModule.exports;
}

const { createRandomOptimizedSolution, optimizeExistingSolution } = load("lib/packing");
const { validateSolution } = load("lib/validation");
const { normalizeSolutionFile, serializeSolution } = load("lib/normalize-solution");
const { SolutionError } = load("types/solution");

function good(id, width, height, length, overrides = {}) {
  return { id, width, height, length, desc: id, color: "#ff0000",
    xCoord: 0, yCoord: 0, zCoord: 0, ...overrides };
}

function solution(goods, width = 2, height = 2, length = 2) {
  return { id: "test", description: "test", calculated: "", calculationSource: { title: "test" },
    container: { id: "container", width, height, length,
      xCoord: 0, yCoord: 0, zCoord: 0, unit: "m", goods } };
}

function errors(value) {
  return validateSolution(value).map((issue) => issue.error);
}

function volume(goods) {
  return goods.reduce((sum, item) => sum + item.width * item.height * item.length, 0);
}

// Independent footprint check using small cells rather than the production
// union-of-rectangles implementation. All seeded sizes are multiples of 50 mm.
function assertSupported(value) {
  const goods = value.container.goods;
  for (const item of goods) {
    if (item.yCoord === 0) continue;
    const bases = goods.filter((base) => base.yCoord + base.height === item.yCoord);
    for (let x = item.xCoord + 25; x < item.xCoord + item.width; x += 50) {
      for (let z = item.zCoord + 25; z < item.zCoord + item.length; z += 50) {
        assert.ok(bases.some((base) => x > base.xCoord && x < base.xCoord + base.width &&
          z > base.zCoord && z < base.zCoord + base.length), `unsupported ${item.id} at ${x},${z}`);
      }
    }
  }
}

test("mixed heights do not create floating layers", () => {
  const input = solution([good("tall", 1, 1.5, 2), good("short", 1, 0.5, 2),
    good("top", 1, 0.5, 2)], 2, 2, 2);
  const result = optimizeExistingSolution(input);
  assert.equal(result.container.goods.length, 3);
  assert.deepEqual(validateSolution(result), []);
  for (const item of result.container.goods.filter((item) => item.yCoord > 0)) {
    assert.ok(result.container.goods.some((base) => base.id === item.stackedOnGood &&
      base.yCoord + base.height === item.yCoord));
  }
  assert.deepEqual(input.container.goods.map((item) => item.yCoord), [0, 0, 0]);
});

test("validator rejects floating goods and partial support", () => {
  assert.ok(errors(solution([good("floating", 1, 0.5, 1, { yCoord: 1 })]))
    .includes(SolutionError.GoodUnsupported));
  assert.ok(errors(solution([good("base", 0.5, 1, 1),
    good("overhang", 1, 0.5, 1, { yCoord: 1 })])).includes(SolutionError.GoodUnsupported));
});

test("coplanar supports may jointly cover a box, but gaps cannot", () => {
  const baseA = good("a", 1, 1, 1);
  const baseB = good("b", 1, 1, 1, { xCoord: 1 });
  const top = good("top", 2, 0.5, 1, { yCoord: 1 });
  assert.deepEqual(validateSolution(solution([baseA, baseB, top])), []);
  assert.ok(errors(solution([{ ...baseA, width: 0.9 }, baseB, top]))
    .includes(SolutionError.GoodUnsupported));
});

test("overlapping support areas cannot hide an unsupported gap", () => {
  const input = solution([good("a", 1.2, 1, 1),
    good("b", 1.2, 1, 1, { xCoord: 0.3 }), good("top", 2, 0.5, 1, { yCoord: 1 })]);
  assert.ok(errors(input).includes(SolutionError.GoodUnsupported));
  assert.ok(errors(input).includes(SolutionError.GoodOverlap));
});

test("optimizer can bridge adjacent full supports", () => {
  const input = solution([good("a", 1, 1, 1), good("b", 1, 1, 1),
    good("top", 2, 0.4, 1, { turningAllowed: false })], 2, 1.4, 1);
  const result = optimizeExistingSolution(input);
  assert.equal(result.container.goods.length, 3);
  assert.deepEqual(validateSolution(result), []);
  assert.equal(result.container.goods.find((item) => item.id === "top").yCoord, 1);
});

test("forbidden rotation is respected and orientation checks both horizontal axes", () => {
  const input = solution([good("fixed", 2, 1, 1, { turningAllowed: false })], 1, 1, 2);
  const fixed = optimizeExistingSolution(input);
  assert.equal(fixed.container.goods.length, 0);
  assert.equal(fixed.unpackedGoods.length, 1);
  const allowed = optimizeExistingSolution({ ...input,
    container: { ...input.container, goods: [{ ...input.container.goods[0], turningAllowed: true }] } });
  assert.equal(allowed.container.goods.length, 1);
  assert.equal(allowed.container.goods[0].turned, true);
  assert.deepEqual(validateSolution(allowed), []);
  const depthLimited = optimizeExistingSolution(solution([good("deep", 1, 1, 2)], 2, 1, 1));
  assert.equal(depthLimited.container.goods.length, 1);
});

test("rotation flags remain relative to the original orientation on repacking", () => {
  const input = solution([good("already-turned", 2, 1, 1, { turned: true, rotated: true })], 1, 1, 2);
  const result = optimizeExistingSolution(input);
  assert.equal(result.container.goods[0].turned, false);
  assert.equal(result.container.goods[0].rotated, false);
  assert.equal(result.container.goods[0].id, "already-turned");
});

test("non-stackable goods stay on the floor and never support other goods", () => {
  for (const goods of [
    [good("base", 1, 1, 1, { stackingAllowed: false }), good("top", 1, 1, 1)],
    [good("base", 1, 1, 1), good("top", 1, 1, 1, { stackingAllowed: false })],
  ]) {
    const result = optimizeExistingSolution(solution(goods, 1, 2, 1));
    assert.equal(result.container.goods.length, 1);
    assert.equal(result.unpackedGoods.length, 1);
    assert.deepEqual(validateSolution(result), []);
  }
  assert.ok(errors(solution([good("base", 1, 1, 1, { stackingAllowed: false }),
    good("top", 1, 1, 1, { yCoord: 1 })])).includes(SolutionError.StackingNotAllowed));
  assert.ok(errors(solution([good("base", 1, 1, 1),
    good("top", 1, 1, 1, { yCoord: 1, stackingAllowed: false })]))
    .includes(SolutionError.StackingNotAllowed));
});

test("an oversized item cannot advance a shelf and discard later fitting items", () => {
  const input = solution([good("oversized", 10, 10, 10), good("small", 1, 1, 1)], 1, 1, 1);
  const result = optimizeExistingSolution(input);
  assert.deepEqual(result.container.goods.map((item) => item.id), ["small"]);
  assert.deepEqual(result.unpackedGoods.map((item) => item.id), ["oversized"]);
});

test("unpacked goods survive download/upload and can be packed after resizing", () => {
  const first = optimizeExistingSolution(solution([good("a", 1, 1, 1), good("b", 1, 1, 1)], 1, 1, 1));
  const restored = normalizeSolutionFile(JSON.parse(JSON.stringify(serializeSolution(first))));
  const second = optimizeExistingSolution(restored);
  assert.equal(second.container.goods.length + second.unpackedGoods.length, 2);
  assert.equal(second.unpackedGoods.length, 1);
  const enlarged = optimizeExistingSolution({ ...restored, container: { ...restored.container, width: 2 } });
  assert.equal(enlarged.container.goods.length, 2);
  assert.equal(enlarged.unpackedGoods.length, 0);
});

test("valid existing layouts cannot lose packed volume or goods", () => {
  const input = solution([good("a", 1, 1, 1), good("b", 1, 1, 1, { xCoord: 1 }),
    good("c", 2, 1, 1, { yCoord: 1 })]);
  const result = optimizeExistingSolution(input);
  assert.equal(result.container.goods.length, input.container.goods.length);
  assert.ok(volume(result.container.goods) >= volume(input.container.goods));
  assert.deepEqual(validateSolution(result), []);
});

test("invalid geometry is reported and never packed", () => {
  for (const width of [0, -1, NaN, Infinity]) {
    const input = solution([good("invalid", width, 1, 1), good("valid", 1, 1, 1)]);
    assert.ok(errors(input).includes(SolutionError.InvalidGoodGeometry));
    const result = optimizeExistingSolution(input);
    assert.deepEqual(result.container.goods.map((item) => item.id), ["valid"]);
    assert.equal(result.unpackedGoods.length, 1);
  }
  assert.ok(errors(solution([good("bad-position", 1, 1, 1, { xCoord: NaN })]))
    .includes(SolutionError.InvalidGoodGeometry));
  const badContainer = solution([good("a", 1, 1, 1)], 0, 1, 1);
  assert.ok(errors(badContainer).includes(SolutionError.InvalidContainerDimensions));
  assert.equal(optimizeExistingSolution(badContainer).unpackedGoods.length, 1);
});

test("touching decimal boxes are valid while real overlaps and boundaries are rejected", () => {
  const input = solution([good("base", 0.3, 0.1 + 0.2, 0.3),
    good("top", 0.3, 0.3, 0.3, { yCoord: 0.3 })], 0.3, 0.6, 0.3);
  assert.deepEqual(validateSolution(input), []);
  assert.ok(errors(solution([good("a", 1, 1, 1), good("b", 1, 1, 1, { xCoord: 0.9 })]))
    .includes(SolutionError.GoodOverlap));
  assert.ok(errors(solution([good("out", 3, 1, 1)])).includes(SolutionError.GoodOutOfContainerXCoord));
});

test("seeded examples are deterministic, fully supported and conserve all items", () => {
  const first = createRandomOptimizedSolution({ seed: 2026, count: 24 });
  const second = createRandomOptimizedSolution({ seed: 2026, count: 24 });
  assert.equal(first.container.goods.length, 24);
  assert.equal(first.unpackedGoods.length, 0);
  assert.deepEqual(first.container.goods, second.container.goods);
  assert.deepEqual(first.unpackedGoods, second.unpackedGoods);
  for (const count of [24, 60]) {
    for (const seed of [1, 42, 2026, 2027, 2147483647]) {
      const result = createRandomOptimizedSolution({ seed, count });
      assert.deepEqual(validateSolution(result), [], `seed ${seed}, count ${count}`);
      assertSupported(result);
      const all = [...result.container.goods, ...result.unpackedGoods];
      assert.equal(all.length, count);
      assert.equal(new Set(all.map((item) => item.id)).size, count);
      const repacked = optimizeExistingSolution(result);
      assert.ok(volume(repacked.container.goods) >= volume(result.container.goods));
      assert.equal(repacked.container.goods.length + repacked.unpackedGoods.length, count);
      assert.deepEqual(validateSolution(repacked), []);
    }
  }
});

test("bundled example remains valid after optimization", () => {
  const input = normalizeSolutionFile(JSON.parse(fs.readFileSync(
    path.resolve(__dirname, "../public/data/exemplary-solution.json"), "utf8")));
  const result = optimizeExistingSolution(input);
  assert.deepEqual(validateSolution(result), []);
  assert.equal(result.container.goods.length + result.unpackedGoods.length, input.container.goods.length);
});
