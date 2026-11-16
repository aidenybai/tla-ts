(*---
description: The module sany/equivalence/26_InstanceWithTest.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/equivalence/26_InstanceWithTest.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
includes:
  - 26_InstanceWithBase.tla
---*)
---- MODULE 26_InstanceWithTest ----
CONSTANT M
I == INSTANCE 26_InstanceWithBase WITH N <- M
THEOREM I!op = I!op
PROOF OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:7:15:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT M
    PROVE  I!op = I!op

    @type: obligationsnumber
    @count: 1
---*)
