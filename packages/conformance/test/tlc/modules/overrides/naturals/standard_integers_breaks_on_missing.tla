(*---
description: "The standard Integers extends Naturals by name, so a replacing file without the operators it uses makes it fail."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Naturals.tla]
outcome: parse-error
---*)
---- MODULE standard_integers_breaks_on_missing ----
EXTENDS Integers
Test == FromFile = 7
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 22, col 11 to line 22, col 11 of module Integers
    | Could not find declaration or definition of symbol '-'.
    | line 22, col 9 to line 22, col 13 of module Integers
    | Couldn't resolve infix operator symbol `-'.
    | Semantic errors:
    | *** Errors: 2
    | line 22, col 11 to line 22, col 11 of module Integers
    | Could not find declaration or definition of symbol '-'.
    | line 22, col 9 to line 22, col 13 of module Integers
    | Couldn't resolve infix operator symbol `-'.
    3002:1 Parsing or semantic analysis failed.
---*)
