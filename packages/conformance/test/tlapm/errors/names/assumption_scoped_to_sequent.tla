(*---
description: A name declared by NEW in a theorem's ASSUME is not in scope in the next theorem.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE assumption_scoped_to_sequent ----
THEOREM ASSUME NEW c PROVE c = c OBVIOUS
THEOREM c = c OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./assumption_scoped_to_sequent.tla", line 9, character 9

    Operator "c" not found

    File "./assumption_scoped_to_sequent.tla", line 9, character 9:
    Error: Operator "c" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
