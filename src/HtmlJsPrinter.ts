import { Printer } from "prettier";
import { AnyNode } from "./parser/MarkoNode";

export type HtmlJsPrinter = Printer<AnyNode>;
