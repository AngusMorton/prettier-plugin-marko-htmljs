import { test } from "../test-utils";

const files = import.meta.glob("/test/fixtures/complex/*/*", {
  eager: true,
  as: "raw",
});

test("Can format an autocomplete component", files, "complex/autocomplete");

test("Can format a simple svg component", files, "complex/simple-svg");
