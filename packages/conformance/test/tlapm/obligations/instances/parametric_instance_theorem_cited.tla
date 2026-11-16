(*---
description: A theorem of a parametrized instance is cited with its argument, as I(c)!Thm, in spite of the warning.
ref: src/module/m_elab.ml#localize
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE parametric_instance_theorem_cited ----
CONSTANT c
VARIABLE x
I(p) == INSTANCE Lib WITH k <- p, v <- x
THEOREM I(c)!Op(c)
  BY I(c)!LT
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
           I!LT(c) 
    PROVE  I!Op(c, c)

    @type: obligation
    @id: 2
    @loc: 13:6:13:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW VARIABLE x
    PROVE  I!LT(c)

    @type: obligationsnumber
    @count: 2

    File "./parametric_instance_theorem_cited.tla", line 11, characters 9-40:
    Warning: Instancing produces parametric theorems.
    Such theorems will be forcibly hidden and cannot be cited.
    (This warning appears at-most once per INSTANCE declaration.)
---*)
