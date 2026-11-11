(*---
description: An infix token with no definition reports the symbol name.
ref: "tla2sany/semantic/Generator.java#generateGenID"
features: [operators]
outcome: parse-error
---*)
---- MODULE operator_undefined_infix ----
Test == (1 ++ 2) = 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 12 to line 8, col 13 of module operator_undefined_infix
    | Could not find declaration or definition of symbol '++'.
    | line 8, col 10 to line 8, col 15 of module operator_undefined_infix
    | Couldn't resolve infix operator symbol `++'.
    3002:1 Parsing or semantic analysis failed.
---*)
