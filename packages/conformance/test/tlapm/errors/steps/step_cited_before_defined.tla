(*---
description: A step can cite only the steps before it, so citing a later step is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE step_cited_before_defined ----
THEOREM TRUE
<1>1. TRUE BY <1>2
<1>2. TRUE OBVIOUS
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_cited_before_defined.tla", line 9, characters 15-18

    Operator "<1>2" not found

    File "./step_cited_before_defined.tla", line 9, characters 15-18:
    Error: Operator "<1>2" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
