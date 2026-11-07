(*---
description: "!: cannot be followed by an operand selector."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE colon_then_operand ----
Op == l:: 1 = 1
Test == Op!:!1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 12 to line 9, col 12 of module colon_then_operand
    | `!:' can be used only after a name and either at the end after an
    | operator name or before an operator name.
    3002:1 Parsing or semantic analysis failed.
---*)
