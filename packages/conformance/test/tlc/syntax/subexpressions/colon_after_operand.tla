(*---
description: "!: cannot follow an operand selector."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE colon_after_operand ----
Op == 1 = 1
Test == Op!1!: = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module colon_after_operand
    | !: should not follow an operand selector.
    3002:1 Parsing or semantic analysis failed.
---*)
