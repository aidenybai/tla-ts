(*---
description: The module sany/equivalence/12_BasicCaseStepProofTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/12_BasicCaseStepProofTest.tla
features:
  - tlapm-test
mode: obligations
outcome: incomplete
---*)
---- MODULE 12_BasicCaseStepProofTest ----
CONSTANT P
THEOREM P \/ ~P 
PROOF
<1>1 CASE P
  PROOF OBVIOUS
<1> CASE ~P
  PROOF OBVIOUS
<1> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 14:9:14:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P
    PROVE  P \/ ~P

    @type: obligation
    @id: 3
    @loc: 16:9:16:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P,
           ~P 
    PROVE  P \/ ~P

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./12_BasicCaseStepProofTest.tla", line 17, characters 1-7
    File "./12_BasicCaseStepProofTest.tla", line 9, character 1 to line 18, character 4:
    [ERROR]: Proof incomplete in module "12_BasicCaseStepProofTest": 1 missing, 0 omitted proof step(s).
---*)
