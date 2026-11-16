(*---
description: When SMT and Zenon both fail, tlapm tries Isabelle with the auto tactic, which proves a fact about addition.
ref: src/params.ml#default_method
mode: proof
args: ['--solver', echo unknown]
outcome: proved
---*)
---- MODULE isabelle_third ----
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

    Zenon error: exhausted search space without finding a proof
    File "./isabelle_third.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
