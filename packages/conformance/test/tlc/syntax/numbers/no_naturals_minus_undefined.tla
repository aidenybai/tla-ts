(*---
description: Prefix minus is defined by Integers and not by Naturals.
ref: "tla2sany/semantic/Generator.java#generateGenID"
features: [numbers]
outcome: parse-error
---*)
---- MODULE no_naturals_minus_undefined ----
EXTENDS Naturals
Test == -1 = -1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 9, col 9 to line 9, col 9 of module no_naturals_minus_undefined
    | Could not find declaration or definition of symbol '-.'.
    | line 9, col 9 to line 9, col 10 of module no_naturals_minus_undefined
    | Couldn't resolve prefix operator symbol `-.'.
    | line 9, col 14 to line 9, col 14 of module no_naturals_minus_undefined
    | Could not find declaration or definition of symbol '-.'.
    | line 9, col 14 to line 9, col 15 of module no_naturals_minus_undefined
    | Couldn't resolve prefix operator symbol `-.'.
    3002:1 Parsing or semantic analysis failed.
---*)
