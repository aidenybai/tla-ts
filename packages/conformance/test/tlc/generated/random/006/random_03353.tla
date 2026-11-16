(*---
description: Evaluates a random int expression, seed 262, number 3353.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03353 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5324 \in (((Nat \cap Nat) \cap {b5325 \in {x \in 1..3 : x > 1} : TRUE}) \cup UNION {UNION {{2, 1, 3}, <<>>}, {2147483647 : b5326 \in {x \in 1..3 : x > 1}}}) : (\E b5327 \in ((b5324 < 3) \cup {b5324, b5324}) : ((SUBSET {1} \cup {2, 1, 3}) = ({x \in 1..3 : x > 1} \ 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03353 failed.
    Attempted to compare the function <<>> with the value:
    {1, 2, 3}
---*)
