(*---
description: Evaluates a random seq expression, seed 262, number 1937.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01937 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b3043 \in (LET b3044 == -1 IN b3044 .. Head(<<>>)) : ((2 = b3043) => (TRUE /\ {1, 2}))), (-((-2) % (CHOOSE b3045 \in {1} : FALSE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
