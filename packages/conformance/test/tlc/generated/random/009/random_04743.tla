(*---
description: Evaluates a random set expression, seed 262, number 4743.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04743 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE))[Head((CHOOSE f \in [2..1 -> 1..2] : TRUE))] .. Len(SelectSeq(SubSeq(<<>>, 0, 2147483647), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
