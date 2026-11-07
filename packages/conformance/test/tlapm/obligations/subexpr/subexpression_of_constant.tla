(*---
description: A subexpression of a declared constant is an invalid subexpression reference.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: rejected
---*)
---- MODULE subexpression_of_constant ----
CONSTANT A
THEOREM A!1
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./subexpression_of_constant.tla", line 9, characters 9-11

    invalid subexpression reference

    File "./subexpression_of_constant.tla", line 9, characters 9-11:
    Error: invalid subexpression reference in:  ?A!1
     tlapm ending abnormally with Failure("Expr.Anon: 3")
---*)
