(*---
description: An OMITTED proof of a step in a subproof makes the run incomplete.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE omitted_inner_step ----
THEOREM TRUE
<1>1. TRUE
  <2>1. TRUE OMITTED
  <2> QED BY <2>1
<1> QED BY <1>1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:9:12:11
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:12:12:16
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 11:11:11:13
    @status: to be proved
    @obl: ASSUME <2>1 
    PROVE  TRUE

    @type: obligation
    @id: 4
    @loc: 11:14:11:18
    @status: to be proved
    @obl: <2>1

    @type: obligationsnumber
    @count: 4

    Omitted proof at File "./omitted_inner_step.tla", line 10, characters 14-20
    File "./omitted_inner_step.tla", line 7, character 1 to line 13, character 4:
    [ERROR]: Proof incomplete in module "omitted_inner_step": 0 missing, 1 omitted proof step(s).
---*)
