(*---
description: A BY DEF entry cannot be a variable.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [proofs]
outcome: parse-error
---*)
---- MODULE by_def_of_variable ----
VARIABLE v
THEOREM TRUE BY DEF v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 21 to line 9, col 21 of module by_def_of_variable
    | DEF clause entry should describe a defined operator.
    | line 9, col 14 to line 9, col 21 of module by_def_of_variable
    | Empty BY
    3002:1 Parsing or semantic analysis failed.
---*)
