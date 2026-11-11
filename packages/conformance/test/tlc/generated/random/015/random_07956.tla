(*---
description: Evaluates a random bool expression, seed 262, number 7956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = CASE (<<1>> = [x \in 1..2 |-> x]) -> (2 \div 3) [] OTHER -> (-1 - 3)] = (CHOOSE r \in [a : 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07956 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 148 to line 14, col 177 of module random_07956
---*)
