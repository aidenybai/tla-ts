(*---
description: Evaluates a random bool expression, seed 262, number 2858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE))[(\E b4528 \in ({x \in 1..3 : x > 1} \cup {2, 1, 3}) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))] < (CASE (TRUE <=> FALSE) -> Cardinality({x \in 1..3 : x > 1}) [] OTHER -> Cardinality({1}) + Len([<<>> EXCEPT ![1] = {2, 1, 3}]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02858 failed.
    Attempted to check equality of integer 1 with non-integer:
    TRUE
---*)
