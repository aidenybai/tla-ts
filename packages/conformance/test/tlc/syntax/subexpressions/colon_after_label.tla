(*---
description: "!: at the end after a label is rejected."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE colon_after_label ----
Op == l:: 1 = 1
Test == Op!l!:
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 14 to line 9, col 14 of module colon_after_label
    | `!:' can be used only after a name and either at the end after an
    | operator name or before an operator name.
    3002:1 Parsing or semantic analysis failed.
---*)
