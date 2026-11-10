(*---
description: Evaluates a random function expression, seed 262, number 893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq([0 EXCEPT ![1] = 3], (1 % -1), IF [a |-> 1] THEN 2147483647 ELSE 2)) :> LET b1440 == LET b1441 == (7 < 2147483647) IN (CHOOSE b1442 \in 1..3 : TRUE) IN ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00893 failed.
    Attempted to apply EXCEPT construct to the value 0.
---*)
