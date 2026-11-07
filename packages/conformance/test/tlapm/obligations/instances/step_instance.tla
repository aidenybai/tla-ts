(*---
description: A proof step may define a named instance of a loaded module, and all of the instance's definitions are visible in the later steps.
ref: src/proof/p_gen.ml#gen_step
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE step_instance ----
CONSTANT c
VARIABLE x
J == INSTANCE Lib WITH k <- c, v <- x
THEOREM c = c
<1> I == INSTANCE Lib WITH k <- c, v <- x
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           I!Op(a) == a = c,
           I!Nxt == x' = c,
           I!Priv$2 == c,
           I!UsesPriv == I!Priv$2 = c,
           I!LA == c = c
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)
