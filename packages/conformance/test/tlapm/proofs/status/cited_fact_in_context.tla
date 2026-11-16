(*---
description: Citing an earlier step makes a support obligation that tlapm finds among the hypotheses and marks trivial, without a backend.
ref: src/backend/prep.ml#find_fact
mode: proof
outcome: proved
---*)
---- MODULE cited_fact_in_context ----
THEOREM ASSUME NEW P, NEW Q, P, P => Q PROVE Q
  <1>1. P OBVIOUS
  <1>2. QED BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:13:10:15
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:13:10:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:16:10:20
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:16:10:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 9:11:9:18
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 9:11:9:18
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./cited_fact_in_context.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
