(*---
description: A definition repeated with the same body through two extended modules is merged into one, so DEF of it lists it once.
ref: src/module/m_elab.ml#normalize
includes: [DupA.tla, DupB.tla]
mode: obligations
outcome: proved
---*)
---- MODULE identical_definitions_merged ----
EXTENDS DupA, DupB
THEOREM Same = 1
  BY DEF Same
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME Same == 1
    PROVE  Same = 1

    @type: obligationsnumber
    @count: 1
---*)
