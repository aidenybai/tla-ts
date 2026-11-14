(*---
description: A substitution may map a parameter to an expression, which replaces it in the instantiated definitions.
ref: src/module/m_elab.ml#instantiate
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE named_instance_expression_substitution ----
EXTENDS Naturals
CONSTANT c
VARIABLE x
I == INSTANCE Lib WITH k <- c + 1, v <- x
THEOREM I!Op(c + 1)
  BY DEF I!Op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x,
           I!Op(a) == a = c + 1
    PROVE  I!Op(c + 1)

    @type: obligationsnumber
    @count: 1
---*)
