(*---
description: Evaluates a random set expression, seed 262, number 410.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00410 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(Head(<<>>) - LET b667 == b666 IN b666) : b666 \in (({2, 1, 3} \ {}) \cup {b668 : b668 \in 1..3})}, ({Cardinality(2..1), (2 - 2147483647)} \cup {(b669 + 7) : b669 \in {b670 \in SUBSET {1} : TRUE}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
