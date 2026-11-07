(*---
description: A named ASSUME ... PROVE theorem cited later contributes its name as a fact, and citing it gives a support obligation proving the name.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE named_sequent_theorem_definition ----
CONSTANT P(_)
THEOREM T == ASSUME NEW x PROVE P(x) \/ ~P(x)
  OBVIOUS
THEOREM P(1) \/ ~P(1)
  BY T
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT x
    PROVE  P(x) \/ ~P(x)

    @type: obligation
    @id: 2
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           T 
    PROVE  P(1) \/ ~P(1)

    @type: obligation
    @id: 3
    @loc: 12:6:12:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  T

    @type: obligationsnumber
    @count: 3
---*)
