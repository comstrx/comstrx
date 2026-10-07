import assert from "node:assert/strict";
import { test } from "node:test";
import { currencyOf, formatPoint, isCountry, isCurrency, isPoint, parsePoint } from "../../src/lib/std/geo.ts";

test("a point parses only from two in-range coordinates", () => {

    assert.deepEqual(parsePoint("24.71360,46.67530"), { latitude: 24.7136, longitude: 46.6753 });
    assert.deepEqual(parsePoint("0,0"), { latitude: 0, longitude: 0 });
    assert.equal(parsePoint("91,0"), undefined);
    assert.equal(parsePoint("0,181"), undefined);
    assert.equal(parsePoint(","), undefined);
    assert.equal(parsePoint("1,2,3"), undefined);
    assert.equal(parsePoint("denied"), undefined);
    assert.equal(parsePoint(undefined), undefined);
    assert.equal(isPoint({ latitude: Number.NaN, longitude: 0 }), false);

});
test("a point round-trips through its cookie form", () => {

    assert.equal(formatPoint({ latitude: 24.713612345, longitude: -46.67534 }), "24.71361,-46.67534");
    assert.deepEqual(parsePoint(formatPoint({ latitude: -33.86882, longitude: 151.20929 })), { latitude: -33.86882, longitude: 151.20929 });

});
test("a country maps to the currency it spends", () => {

    assert.equal(currencyOf("SA"), "SAR");
    assert.equal(currencyOf("EG"), "EGP");
    assert.equal(currencyOf("AE"), "AED");
    assert.equal(currencyOf("US"), "USD");
    assert.equal(currencyOf("DE"), "EUR");
    assert.equal(currencyOf("BG"), "EUR");
    assert.equal(currencyOf("CW"), "XCG");
    assert.equal(currencyOf("AQ"), undefined);

});
test("only assigned country codes are countries", () => {

    assert.equal(isCountry("SA"), true);
    assert.equal(isCountry("XK"), true);
    assert.equal(isCountry("sa"), false);
    assert.equal(isCountry("XX"), false);
    assert.equal(isCountry("T1"), false);
    assert.equal(isCountry(undefined), false);

});
test("every mapped currency is one the runtime can format", () => {

    const known = new Set(Intl.supportedValuesOf("currency"));
    const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
    const codes = letters.flatMap(( first ) => letters.map(( second ) => `${first}${second}`));
    const mapped = codes.map(( code ) => currencyOf(code)).filter(( currency ) => currency !== undefined);

    assert.equal(mapped.length, 249);
    assert.deepEqual(mapped.filter(( currency ) => !known.has(currency)), []);

});
test("a currency code is three capital letters", () => {

    assert.deepEqual(["SAR", "sar", "SA", "SARS", "S4R", undefined, 7].map(( value ) => isCurrency(value)), [true, false, false, false, false, false, false]);

});
