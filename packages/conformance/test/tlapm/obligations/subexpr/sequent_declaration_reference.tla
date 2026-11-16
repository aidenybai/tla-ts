(*---
description: A subexpression of an ASSUME ... PROVE that names a NEW declaration is rejected.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: rejected
---*)
---- MODULE sequent_declaration_reference ----
CONSTANT P(_)
THEOREM T == ASSUME NEW x, P(x) PROVE P(x)
  OBVIOUS
THEOREM T!1
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sequent_declaration_reference.tla", line 11, characters 9-11

    subexpression reference does not resolve to an expression

    File "./sequent_declaration_reference.tla", line 11, characters 9-11:
    Error: subexpression reference does not resolve to an expression
     tlapm ending abnormally with Failure("Expr.Deref.deref_num")
---*)
