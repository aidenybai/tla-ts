(*---
description: Op!lab(e, f) for a label with one parameter is rejected.
ref: src/expr/e_deref.ml#deref_label
mode: obligations
outcome: rejected
---*)
---- MODULE label_wrong_arity ----
CONSTANT P(_)
Op == \A x : lab(x) :: P(x)
THEOREM Op!lab(1, 2)
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./label_wrong_arity.tla", line 9, characters 24-27

    Expected 1 argument for labelled reference !lab, but found 2

    File "./label_wrong_arity.tla", line 9, characters 24-27:
    Error: Expected 1 argument for labelled reference !lab, but found 2
     tlapm ending abnormally with Failure("Expr.Deref.deref_lsub")
---*)
