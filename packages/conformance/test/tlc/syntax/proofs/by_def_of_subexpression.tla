(*---
description: A BY DEF entry cannot be a subexpression.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [proofs]
outcome: parse-error
---*)
---- MODULE by_def_of_subexpression ----
A == 1 = 1
THEOREM TRUE BY DEF A!1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 21 to line 9, col 23 of module by_def_of_subexpression
    | DEF clause entry should describe a defined operator.
    | line 9, col 14 to line 9, col 23 of module by_def_of_subexpression
    | Empty BY
    3002:1 Parsing or semantic analysis failed.
---*)
