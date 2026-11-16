(*---
description: DEF of a constant declared by NEW in the theorem reports that it is not a definition and goes on.
ref: src/proof/p_anon.ml#usable
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE by_def_new_constant_reported ----
THEOREM ASSUME NEW a PROVE a = a
  BY DEF a
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT a
    PROVE  a = a

    @type: warning
    @msg: File "./by_def_new_constant_reported.tla", line 10, character 10 :
    "a" is not a definition and cannot be used in a DEF clause.

    @type: obligationsnumber
    @count: 1
---*)
