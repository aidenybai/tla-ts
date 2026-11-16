(*---
description: DEF of a variable in a USE step reports that it is not a definition, drops it and goes on.
ref: src/proof/p_anon.ml#usable
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE by_def_variable_reported ----
VARIABLE x
THEOREM x = x
<1> USE DEF x
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x
    PROVE  x = x

    @type: warning
    @msg: File "./by_def_variable_reported.tla", line 11, character 13 :
    "x" is not a definition and cannot be used in a DEF clause.

    @type: obligationsnumber
    @count: 1
---*)
