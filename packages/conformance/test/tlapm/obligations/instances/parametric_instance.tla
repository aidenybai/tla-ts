(*---
description: A parametrized instance I(p) adds p as a first parameter of each definition, and warns that its theorems are parametric.
ref: src/module/m_elab.ml#localize
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE parametric_instance ----
CONSTANT c
VARIABLE x
I(p) == INSTANCE Lib WITH k <- p, v <- x
THEOREM I(c)!Op(c)
  BY DEF I!Op
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
           I!Op(p, a) == a = p
    PROVE  I!Op(c, c)

    @type: obligationsnumber
    @count: 1

    File "./parametric_instance.tla", line 11, characters 9-40:
    Warning: Instancing produces parametric theorems.
    Such theorems will be forcibly hidden and cannot be cited.
    (This warning appears at-most once per INSTANCE declaration.)
---*)
