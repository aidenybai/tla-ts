(*---
description: '--method auto runs Isabelle with the auto tactic.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', auto]
outcome: proved
---*)
---- MODULE method_auto ----
EXTENDS Naturals
THEOREM 2 + 2 = 4
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
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./method_auto.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
