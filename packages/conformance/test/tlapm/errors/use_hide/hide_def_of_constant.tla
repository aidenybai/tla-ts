(*---
description: HIDE DEF of a declared constant reports that c is not a definition, but through Errors.err, which does not fail the run, so --strict still exits 0. The comment in usable says it rejects the clause (src/proof/p_anon.ml#usable).
ref: src/proof/p_anon.ml#usable
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE hide_def_of_constant ----
CONSTANT c
THEOREM TRUE
<1> HIDE DEF c
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:9:12:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  TRUE

    @type: warning
    @msg: File "./hide_def_of_constant.tla", line 11, character 14 :
    "c" is not a definition and cannot be used in a DEF clause.

    @type: obligationsnumber
    @count: 1
---*)
