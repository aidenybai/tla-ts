(*---
description: '--stretch leaves an rlimit budget''s infinite time limit infinite.'
ref: src/method.ml#scale_time
mode: proof
args: ['--stretch', '3']
outcome: proved
---*)
---- MODULE stretch_keeps_rlimit ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMTT("r1")
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
    @meth: time-limit: inf
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:16
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./stretch_keeps_rlimit.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
