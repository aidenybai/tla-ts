(*---
description: The module sany/equivalence/14_BasicPTLProofTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/14_BasicPTLProofTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 14_BasicPTLProofTest ----
EXTENDS TLAPS
VARIABLE P
THEOREM []P => P
PROOF BY PTL
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:7:13:9
    @status: to be proved
    @obl: ASSUME NEW VARIABLE P,
           PTL 
    PROVE  []P => P

    @type: obligation
    @id: 2
    @loc: 13:10:13:13
    @status: to be proved
    @obl: ASSUME NEW VARIABLE P
    PROVE  PTL

    @type: obligationsnumber
    @count: 2
---*)
