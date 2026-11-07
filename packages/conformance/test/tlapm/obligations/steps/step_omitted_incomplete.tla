(*---
description: An OMITTED step proof gives no obligation, and the run is incomplete with one omitted step.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE step_omitted_incomplete ----
THEOREM TRUE
<1>1. TRUE
  OMITTED
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved
    @obl: <1>1

    @type: obligationsnumber
    @count: 2

    Omitted proof at File "./step_omitted_incomplete.tla", line 10, characters 3-9
    File "./step_omitted_incomplete.tla", line 7, character 1 to line 13, character 4:
    [ERROR]: Proof incomplete in module "step_omitted_incomplete": 0 missing, 1 omitted proof step(s).
---*)
