(*---
description: A label parameter that is not a bound identifier is rejected.
ref: src/expr/e_anon.ml#pform
mode: obligations
outcome: rejected
---*)
---- MODULE label_unknown_parameter ----
CONSTANT P(_)
Op == \A x : lab(y) :: P(x)
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./label_unknown_parameter.tla", line 9, characters 14-22

    Identifier "y" in label parameters not found

    File "./label_unknown_parameter.tla", line 9, characters 14-22:
    Error: Identifier "y" in label parameters not found
     tlapm ending abnormally with Failure("Expr.Anon")
---*)
