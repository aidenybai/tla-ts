(*---
description: Evaluates a random seq expression, seed 262, number 9583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq([<<7, 0>> EXCEPT ![1] = (CHOOSE b14880 \in {2, 1, 3} : TRUE)], LET b14881 == (2147483647 - 2147483647) IN (<<5, 6>>)[b14881], LET b14882 == (3 * 2147483647) IN (CHOOSE f \in [2..1 -> 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09583 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
