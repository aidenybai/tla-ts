(*---
description: Evaluates a random bool expression, seed 262, number 9873.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09873 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF TRUE THEN 3 ELSE -1 .. (7 - 0)) \ ({b15338 \in {2, 1, 3} : TRUE} \ {b15339 \in {} : FALSE})) = ({Len({1}) : b15340 \in ({} \cup {1, 2})} \cap {b15341 \in {b15342 : b15342 \in 1..3} : (FALSE => TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {1}
---*)
