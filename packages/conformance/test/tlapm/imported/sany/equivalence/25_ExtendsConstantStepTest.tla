(*---
description: The module sany/equivalence/25_ExtendsConstantStepTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/25_ExtendsConstantStepTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
includes:
  - 25_ExtendsConstantBase.tla
---*)
---- MODULE 25_ExtendsConstantStepTest ----
EXTENDS 25_ExtendsConstantBase
THEOREM
  ASSUME TypeInv, [Next]_store, NEW k \in Key
  PROVE  TypeInv'
PROOF BY DEF TypeInv, Next
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:7:16:9
    @status: to be proved
    @obl: ASSUME NEW CONSTANT Key,
           NEW VARIABLE store,
           TypeInv == store \in SUBSET Key,
           Next == store' = store,
           TypeInv ,
           [Next]_store ,
           NEW CONSTANT k \in Key
    PROVE  TypeInv'

    @type: obligationsnumber
    @count: 1
---*)
