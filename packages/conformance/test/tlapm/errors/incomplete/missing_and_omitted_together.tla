(*---
description: Missing and omitted proofs are counted separately in the incomplete report.
ref: src/tlapm_lib.ml#process_module
mode: obligations
outcome: incomplete
---*)
---- MODULE missing_and_omitted_together ----
THEOREM TRUE
<1>1. TRUE
<1>2. TRUE OMITTED
<1>3. TRUE
<1> QED BY <1>1, <1>2, <1>3
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:9:12:11
    @status: to be proved
    @obl: ASSUME <1>1 ,
           <1>2 ,
           <1>3 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:12:12:16
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 12:18:12:22
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  <1>2

    @type: obligation
    @id: 4
    @loc: 12:24:12:28
    @status: to be proved
    @obl: ASSUME <1>1 ,
           <1>2 
    PROVE  <1>3

    @type: obligationsnumber
    @count: 4

    Missing proof at File "./missing_and_omitted_together.tla", line 9, characters 1-10
    Missing proof at File "./missing_and_omitted_together.tla", line 11, characters 1-10
    Omitted proof at File "./missing_and_omitted_together.tla", line 10, characters 12-18
    File "./missing_and_omitted_together.tla", line 7, character 1 to line 13, character 4:
    [ERROR]: Proof incomplete in module "missing_and_omitted_together": 2 missing, 1 omitted proof step(s).
---*)
