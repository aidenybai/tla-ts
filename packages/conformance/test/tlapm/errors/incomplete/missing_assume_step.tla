(*---
description: An ASSUME ... PROVE step without a proof counts as missing.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE missing_assume_step ----
THEOREM TRUE
<1>1. ASSUME TRUE PROVE TRUE
<1> QED BY <1>1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:9:10:11
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 10:12:10:16
    @status: to be proved
    @obl: <1>1

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./missing_assume_step.tla", line 9, characters 1-28
    File "./missing_assume_step.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: Proof incomplete in module "missing_assume_step": 1 missing, 0 omitted proof step(s).
---*)
