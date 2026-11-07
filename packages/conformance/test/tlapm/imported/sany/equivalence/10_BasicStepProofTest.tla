(*---
description: The module sany/equivalence/10_BasicStepProofTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/10_BasicStepProofTest.tla
features:
  - tlapm-test
mode: obligations
outcome: incomplete
---*)
---- MODULE 10_BasicStepProofTest ----
A == 0
B == 0
C == 0
THEOREM AB == A = B
PROOF BY ONLY DEFS A, B
THEOREM BC == B = C
PROOF BY ONLY DEFS B, C
THEOREM AC == A = C
PROOF
<1>a AB
<1>b BC
<1>c QED

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:7:14:9
    @status: to be proved
    @obl: ASSUME A == 0,
           B == 0
    PROVE  A = B

    @type: obligation
    @id: 2
    @loc: 16:7:16:9
    @status: to be proved
    @obl: ASSUME B == 0,
           C == 0
    PROVE  B = C

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./10_BasicStepProofTest.tla", line 19, characters 1-7
    Missing proof at File "./10_BasicStepProofTest.tla", line 20, characters 1-7
    Missing proof at File "./10_BasicStepProofTest.tla", line 21, characters 1-8
    File "./10_BasicStepProofTest.tla", line 9, character 1 to line 23, character 4:
    [ERROR]: Proof incomplete in module "10_BasicStepProofTest": 3 missing, 0 omitted proof step(s).
---*)
