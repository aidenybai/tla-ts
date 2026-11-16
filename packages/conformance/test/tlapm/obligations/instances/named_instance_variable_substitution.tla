(*---
description: Substituting a variable for an instance's variable replaces it inside primed expressions too.
ref: src/module/m_elab.ml#instantiate
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE named_instance_variable_substitution ----
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c, v <- x
THEOREM I!Nxt => x' = c
  BY DEF I!Nxt
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           I!Nxt == x' = c
    PROVE  I!Nxt => x' = c

    @type: obligationsnumber
    @count: 1
---*)
