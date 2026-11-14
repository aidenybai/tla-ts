(*---
description: '--method smt:2 runs the default SMT solver with a 2 second limit.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', smt:2]
outcome: proved
---*)
---- MODULE method_smt_timeout ----
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
    @meth: time-limit: 2
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./method_smt_timeout.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
