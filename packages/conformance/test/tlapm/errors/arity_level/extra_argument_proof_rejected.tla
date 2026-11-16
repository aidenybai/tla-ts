(*---
description: Before running a backend, tlapm computes the level of each obligation, and that rejects F(1, 2) for a one-parameter F with Invalid number of arguments.
ref: src/expr/e_levels.ml#level_computation
mode: proof
outcome: rejected
---*)
---- MODULE extra_argument_proof_rejected ----
F(a) == a
THEOREM F(1, 2) = 1 OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:21:9:28
    @status: to be proved

    @type: obligationsnumber
    @count: 1

    @type: warning
    @msg: File "./extra_argument_proof_rejected.tla", line 9, characters 9-15

    Invalid number of arguments

    File "./extra_argument_proof_rejected.tla", line 9, characters 9-15:
    Error: Invalid number of arguments
     tlapm ending abnormally with Failure("Expr.Levels: ARITY")
---*)
