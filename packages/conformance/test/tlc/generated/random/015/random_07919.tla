(*---
description: Evaluates a random seq expression, seed 262, number 7919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SelectSeq(Tail(<<>>), LAMBDA e : e > 0) \o Tail([<<1>> EXCEPT ![1] = 7])) EXCEPT ![1] = IF ((FALSE => FALSE) <=> (\A b12223 \in 2..1 : TRUE)) THEN LET b12224 == Cardinality(2..1) IN (2147483647 - b12224) ELSE Cardinality({3, -1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
