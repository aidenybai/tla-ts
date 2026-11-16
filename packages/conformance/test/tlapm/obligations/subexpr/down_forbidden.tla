(*---
description: "!: after a numbered selector is forbidden and rejected."
ref: src/expr/e_deref.ml#deref
mode: obligations
outcome: rejected
---*)
---- MODULE down_forbidden ----
CONSTANT A, B
Op == A /\ B
THEOREM Op!1!:
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./down_forbidden.tla", line 9, character 7

    !: is forbidden for this expression.

    File "./down_forbidden.tla", line 9, character 7:
    Error: !: is forbidden for this expression:
    A
     tlapm ending abnormally with Failure("Expr.Deref.deref: !:")
---*)
