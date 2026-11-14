(*---
description: An operator declared RECURSIVE is not supported, so tlapm rejects the module when it elaborates the definition.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: rejected
---*)
---- MODULE recursive_rejected ----
EXTENDS Naturals
RECURSIVE F(_)
F(n) == IF n = 0 THEN 0 ELSE F(n - 1)
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./recursive_rejected.tla", line 9, characters 1-14

    Recursive operators not supported by TLAPS

     tlapm ending abnormally with Failure("Expr.Anon: Recursive")
---*)
