(*---
description: Evaluates a random bool expression, seed 262, number 8313.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08313 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SubSeq(<<2, [x \in Nat |-> x + 1]>>, Head(<<>>), (3 \div 2)), ((3 * 0) + Len(<<>>))) = (CHOOSE f \in [{} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
