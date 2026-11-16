(*---
description: The level computation before a backend also rejects a declared operator CONSTANT F(_) applied to two arguments.
ref: src/expr/e_levels.ml#level_computation
mode: proof
outcome: rejected
---*)
---- MODULE declared_extra_argument_proof_rejected ----
CONSTANT F(_)
THEOREM F(1, 2) = F(1, 2) OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:27:9:34
    @status: to be proved

    @type: obligationsnumber
    @count: 1

    @type: warning
    @msg: File "./declared_extra_argument_proof_rejected.tla", line 9, characters 9-15

    Invalid number of arguments

    File "./declared_extra_argument_proof_rejected.tla", line 9, characters 9-15:
    Error: Invalid number of arguments
     tlapm ending abnormally with Failure("Expr.Levels: ARITY")
---*)
