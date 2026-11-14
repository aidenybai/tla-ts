(*---
description: "HIDE of an operator name without DEF hides an expression, and an expression that is not a fact in the context is rejected: tlapm reports it, then raises an uncaught Failure, so it also prints its internal-bug message."
ref: src/proof/p_gen.ml#set_expr
mode: obligations
outcome: rejected
---*)
---- MODULE hide_operator_not_in_context ----
F(a) == a
THEOREM TRUE
<1> HIDE F
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

    File "./hide_operator_not_in_context.tla", line 10, character 10:
    Error: This expression does not appear in the context and cannot be hidden.
     tlapm ending abnormally with Failure("proof.Gen.set_expr")
---*)
