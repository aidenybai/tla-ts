(*---
description: A subexpression of an unknown operator is rejected.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: rejected
---*)
---- MODULE subexpression_of_unknown ----
THEOREM Nope!1
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./subexpression_of_unknown.tla", line 8, characters 9-14

    Operator "Nope" not found

    File "./subexpression_of_unknown.tla", line 8, characters 9-14:
    Error: Operator "Nope" not found
     tlapm ending abnormally with Failure("Expr.Anon: 1NUM")
---*)
