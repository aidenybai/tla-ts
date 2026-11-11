(*---
description: "A label is selected from the definition's own label set, so an operand selector before its name is rejected."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_not_reached_by_operand_selector ----
EXTENDS Naturals
Op == 2 * (l:: 3 + 4)
Test == Op!2!l = 7
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 12 to line 10, col 12 of module label_not_reached_by_operand_selector
    | A name selector here must be from a LET clause.
    3002:1 Parsing or semantic analysis failed.
---*)
