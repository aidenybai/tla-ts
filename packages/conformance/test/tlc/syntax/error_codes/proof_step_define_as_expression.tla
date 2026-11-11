(*---
description: A DEFINE step has no expression value.
ref: "tla2sany/semantic/Generator.java#generateProof"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE proof_step_define_as_expression ----
THEOREM TRUE
<1>a DEFINE x == 1
<1>b <1>a
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 9 of module proof_step_define_as_expression
    | Step number of non-expression step used as an expression.
    3002:1 Parsing or semantic analysis failed.
---*)
