(*---
description: A pragma definition may fix the timeout as a number, which tlapm reports as the time limit.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE custom_pragma_float_timeout ----
EXTENDS Naturals, TLAPS
MySmt == TRUE (*{ by (prover:"smt"; timeout:12) }*)
THEOREM \A x \in Nat : x + 0 = x
  BY MySmt
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: smt
    @meth: time-limit: 12
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./custom_pragma_float_timeout.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
