(*---
description: Two extended modules that define the same name differently both keep their definition, and the later one is printed with a suffix.
ref: src/module/m_elab.ml#normalize
includes: [DupA.tla, DupC.tla]
mode: obligations
outcome: proved
---*)
---- MODULE conflicting_definitions ----
EXTENDS DupA, DupC
THEOREM Same = 2
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
    @obl: ASSUME Same_1 == 2
    PROVE  Same_1 = 2

    @type: obligationsnumber
    @count: 1
---*)
