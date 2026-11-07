(*---
description: A BY that cites only an expansion pragma such as ExpandENABLED still gets the default methods, so SMT proves the goal.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: proved
---*)
---- MODULE expansion_pragma_adds_defaults ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY ExpandENABLED
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
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./expansion_pragma_adds_defaults.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
