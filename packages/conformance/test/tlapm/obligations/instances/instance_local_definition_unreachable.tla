(*---
description: A LOCAL definition of the instantiated module is not available as I!Priv.
ref: src/module/m_elab.ml#localize
includes: [Lib.tla]
mode: obligations
outcome: rejected
---*)
---- MODULE instance_local_definition_unreachable ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x
THEOREM I!Priv = c
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./instance_local_definition_unreachable.tla", line 12, characters 9-14

    Operator "I!Priv" not found

     tlapm ending abnormally with Failure("Expr.Anon: 1EMPTY")
---*)
