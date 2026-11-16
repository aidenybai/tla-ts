(*---
description: HIDE of a formula that was never assumed or proved is not in the context, so it is rejected.
ref: src/proof/p_gen.ml#set_expr
mode: obligations
outcome: rejected
---*)
---- MODULE hide_unproved_expression ----
CONSTANT c
THEOREM TRUE
<1> HIDE c = 1
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: error
    @url: http://tla.msr-inria.inria.fr/bugs
    @msg: Oops, this seems to be a bug in TLAPM.
    Please give feedback to developers.


     Failure("proof.Gen.set_expr")

    File "./hide_unproved_expression.tla", line 10, characters 10-14:
    Error: This expression does not appear in the context and cannot be hidden.
     tlapm ending abnormally with Failure("proof.Gen.set_expr")
---*)
