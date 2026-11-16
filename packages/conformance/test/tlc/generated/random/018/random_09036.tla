(*---
description: Evaluates a random bool expression, seed 262, number 9036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(DOMAIN (CHOOSE f \in [{1} -> 1..2] : TRUE) \subseteq [b14033 \in ({x \in 1..3 : x > 1} \cap 2147483647) |-> LET b14034 == 0 IN 2147483647])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09036 failed.
    Attempted to check if the value:
    2
    is an element of the integer 2147483647
---*)
