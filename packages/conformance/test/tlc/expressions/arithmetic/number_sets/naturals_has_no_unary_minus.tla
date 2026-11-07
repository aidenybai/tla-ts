(*---
description: "Naturals does not define unary minus."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE naturals_has_no_unary_minus ----
EXTENDS Naturals
Test == -1 = 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 9 to line 9, col 9 of module naturals_has_no_unary_minus
    | Could not find declaration or definition of symbol '-.'.
    | line 9, col 9 to line 9, col 10 of module naturals_has_no_unary_minus
    | Couldn't resolve prefix operator symbol `-.'.
    3002:1 Parsing or semantic analysis failed.
---*)
