(*---
description: Evaluates a random bool expression, seed 262, number 8384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq((Tail(<<3, 1, 2>>) \o (2147483647 \in 1)), (IF FALSE THEN 1 ELSE 7 \div ([a |-> 1, b |-> TRUE]).a), IF (\A b12971 \in {x \in 1..3 : x > 1} : FALSE) THEN Cardinality(3) ELSE (1 * 7)) = (CHOOSE f \in [{2, 1, 3} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08384 failed.
    Attempted to check if the value:
    2147483647
    is an element of the integer 1
---*)
