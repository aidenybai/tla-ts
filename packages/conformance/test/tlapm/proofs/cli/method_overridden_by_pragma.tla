(*---
description: A pragma in BY takes precedence over --method.
ref: src/backend/prep.ml#find_meth
mode: proof
args: ['--method', zenon]
outcome: proved
---*)
---- MODULE method_overridden_by_pragma ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMT
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
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./method_overridden_by_pragma.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
