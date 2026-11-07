(*---
description: SMTT(0) gives a zero time limit, which tlapm omits from the method line, and a fast proof still succeeds because the limit is only checked after the wait delay.
ref: src/backend/toolbox.ml#toolbox_print
mode: proof
outcome: proved
---*)
---- MODULE smtt_zero_seconds ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMTT(0)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: smt
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:13
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smtt_zero_seconds.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
