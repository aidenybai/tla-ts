(*---
description: The module sany/equivalence/17_ActionOperatorTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/17_ActionOperatorTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 17_ActionOperatorTest ----
EXTENDS TLAPS
VARIABLE x
Next == x' = x
THEOREM
  ASSUME [][Next]_x
  PROVE  [][UNCHANGED x]_x
PROOF
  <1> [Next]_x => UNCHANGED x BY ONLY DEF Next
  <1> QED BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:11:18:13
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           [][Next]_x ,
           <1>_a3 ,
           PTL 
    PROVE  [][UNCHANGED x]_x

    @type: obligation
    @id: 2
    @loc: 18:14:18:17
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           [][Next]_x ,
           <1>_a3 
    PROVE  PTL

    @type: obligation
    @id: 3
    @loc: 17:31:17:33
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           Next == x' = x
    PROVE  [Next]_x => UNCHANGED x

    @type: obligationsnumber
    @count: 3
---*)
