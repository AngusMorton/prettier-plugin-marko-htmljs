import { test } from "../test-utils";

const files = import.meta.glob("/test/fixtures/basic/*/*", {
  eager: true,
  as: "raw",
});

test("Can format a basic marko file", files, "basic/basic-html");

test("Can format attributes", files, "basic/attributes");

test("Can format custom tags", files, "basic/custom-tag");

test("Can format control-flow", files, "basic/control-flow");

test("Can format attr tags", files, "basic/attr-tag");

test("Can format dynamic tags", files, "basic/dynamic-tag-name");

test("Can format a scriptlet", files, "basic/scriptlet");

test("Can format a script tag", files, "basic/script-tag");

test("Can format a style tag", files, "basic/style-tag");

test("Can format a class", files, "basic/class");

test("Can format imports", files, "basic/imports");

test("Can format exports", files, "basic/exports");

// test("Can format typescript", files, "basic/typescript");
