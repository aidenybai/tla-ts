(*---
description: '--method z3 calls Z3 directly as prover z3.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', z3]
outcome: proved
---*)
---- MODULE method_z3 ----
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
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./method_z3.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
