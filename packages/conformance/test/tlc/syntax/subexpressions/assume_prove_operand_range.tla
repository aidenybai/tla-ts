(*---
description: An ASSUME/PROVE selector past the goal is rejected.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE assume_prove_operand_range ----
THEOREM T == ASSUME 1 = 1 PROVE 2 = 2
Test == T!3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 11 to line 9, col 11 of module assume_prove_operand_range
    | Nonexistent operand specified by `argument selector 3'.
    3002:1 Parsing or semantic analysis failed.
---*)
