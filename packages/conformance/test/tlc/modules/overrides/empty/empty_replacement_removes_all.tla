(*---
description: An empty replacing Naturals.tla leaves nothing of the standard module.
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Naturals.tla]
outcome: parse-error
---*)
---- MODULE empty_replacement_removes_all ----
EXTENDS Naturals
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 11 to line 10, col 11 of module empty_replacement_removes_all
    | Could not find declaration or definition of symbol '+'.
    | line 10, col 9 to line 10, col 13 of module empty_replacement_removes_all
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
