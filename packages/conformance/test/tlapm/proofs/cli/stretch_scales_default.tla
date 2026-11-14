(*---
description: '--stretch multiplies the time limit of each method, so the default SMT limit of 5 becomes 10.'
ref: src/method.ml#scale_time
mode: proof
args: ['--stretch', '2']
outcome: proved
---*)
---- MODULE stretch_scales_default ----
EXTENDS Naturals
THEOREM \A x \in Nat : x + 0 = x
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: proved
    @prover: smt
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./stretch_scales_default.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
