(*---
description: A main obligation whose goal is one of its hypotheses still goes to a backend rather than being trivial.
ref: src/backend/prep.ml#trivial
mode: proof
outcome: proved
---*)
---- MODULE goal_is_hypothesis ----
THEOREM ASSUME NEW P, P PROVE P
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./goal_is_hypothesis.tla", line 7, character 1 to line 10, character 4:
    [INFO]: All 1 obligation proved.
---*)
