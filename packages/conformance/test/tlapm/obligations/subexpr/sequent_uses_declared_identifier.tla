(*---
description: A subexpression of an ASSUME ... PROVE that mentions an identifier declared therein is rejected.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: rejected
---*)
---- MODULE sequent_uses_declared_identifier ----
CONSTANT P(_)
THEOREM T == ASSUME NEW x, P(x) PROVE P(x)
  OBVIOUS
THEOREM T!2
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sequent_uses_declared_identifier.tla", line 11, characters 9-11

    Subexpression of ASSUME/PROVE uses identifiers declared therein

    Tlapm does not handle yet such subexpression namings.

    File "./sequent_uses_declared_identifier.tla", line 11, characters 9-11:
    Error: subexpression of ASSUME/PROVE uses identifiers declared therein
    Tlapm does not handle yet such subexpression namings.
     tlapm ending abnormally with Failure("Expr.Deref.deref_num")
---*)
