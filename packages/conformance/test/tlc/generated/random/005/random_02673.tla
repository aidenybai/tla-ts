(*---
description: Evaluates a random int expression, seed 262, number 2673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = IF (<<1>> = (1 :> 2)) THEN (7 % -1) ELSE (0 \div 0)]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02673 failed.
    2179:0 The second argument of \div is 0.
---*)
