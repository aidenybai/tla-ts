(*---
description: SMTT accepts a decimal number of seconds and reports it unchanged as the time limit.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE smtt_decimal_seconds ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMTT(2.5)
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
    @meth: time-limit: 2.5
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smtt_decimal_seconds.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
