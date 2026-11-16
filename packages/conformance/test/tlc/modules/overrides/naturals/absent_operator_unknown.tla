(*---
description: "An operator of the standard module that the replacing file leaves out does not exist, even though Java has an implementation."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [Naturals.tla]
outcome: parse-error
---*)
---- MODULE absent_operator_unknown ----
EXTENDS Naturals
Test == (1 * 1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 12 to line 10, col 12 of module absent_operator_unknown
    | Could not find declaration or definition of symbol '*'.
    | line 10, col 10 to line 10, col 14 of module absent_operator_unknown
    | Couldn't resolve infix operator symbol `*'.
    3002:1 Parsing or semantic analysis failed.
---*)
