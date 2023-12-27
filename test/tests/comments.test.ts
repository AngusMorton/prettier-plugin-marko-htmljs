import { test } from "../test-utils";

const files = import.meta.glob("/test/fixtures/comments/*/*", {
  eager: true,
  as: "raw",
});

test("Can format comments in html", files, "comments/html");
