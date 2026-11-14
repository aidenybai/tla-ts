(*---
description: The module sany/equivalence/25_ExtendsConstantBase.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/25_ExtendsConstantBase.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
---- MODULE 25_ExtendsConstantBase ----
CONSTANT Key
VARIABLE store
TypeInv == store \in SUBSET Key
Next == store' = store
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0
---*)
