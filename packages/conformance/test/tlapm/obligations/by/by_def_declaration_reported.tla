(*---
description: DEF of a declared constant reports that it is not a definition, drops it and goes on, so --strict still succeeds.
ref: src/proof/p_anon.ml#usable
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE by_def_declaration_reported ----
CONSTANT c
THEOREM c = c
  BY DEF c
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: warning
    @msg: File "./by_def_declaration_reported.tla", line 11, character 10 :
    "c" is not a definition and cannot be used in a DEF clause.

    @type: obligationsnumber
    @count: 1
---*)
