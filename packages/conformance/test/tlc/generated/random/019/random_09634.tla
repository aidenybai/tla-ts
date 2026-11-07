(*---
description: Evaluates a random seq expression, seed 262, number 9634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(<<Cardinality(<<3, 1, 2>>), (2147483647 - 7)>>, (Cardinality(SUBSET {1}) - ([x \in Nat |-> x + 1])[7])) \o [[SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = LET b14957 == 2 IN 1] EXCEPT ![1] = (Head(<<1, 2>>) - {b14958 : b14958 \in SUBSET {1}})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
---*)
