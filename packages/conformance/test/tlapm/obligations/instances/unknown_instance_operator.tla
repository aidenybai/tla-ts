(*---
description: I!Op for an operator that the instantiated module does not define is an unknown operator.
ref: src/expr/e_anon.ml#anon_sg
includes: [Lib.tla]
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_instance_operator ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x
THEOREM I!Missing
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_instance_operator.tla", line 12, characters 9-17

    Operator "I!Missing" not found

     tlapm ending abnormally with Failure("Expr.Anon: 1EMPTY")
---*)
