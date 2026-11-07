(*---
description: An rlimit budget may be a fraction of the base resource count.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE smtt_rlimit_fraction ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMTT("r0.5")
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
    @meth: time-limit: inf
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smtt_rlimit_fraction.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
