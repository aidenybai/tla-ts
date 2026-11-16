(*---
description: "A HAVE step's number is not an expression."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [proofs]
outcome: parse-error
---*)
---- MODULE step_name_as_expression_have ----
THEOREM T == TRUE
<1>1. HAVE TRUE
<1>2. <1>1
<1> QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 7 to line 10, col 10 of module step_name_as_expression_have
    | HAVE proof step selected instead of expression.
    3002:1 Parsing or semantic analysis failed.
---*)
