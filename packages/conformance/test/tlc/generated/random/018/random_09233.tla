(*---
description: Evaluates a random record expression, seed 262, number 9233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b14328 == (-(2147483647 \div 2)) IN ((SUBSET {1} = {2, 1, 3}) /\ (\A b14329 \in {1, 2} : TRUE)), b |-> (((CHOOSE r \in [a : 2..1] : TRUE) = (CHOOSE r \in [a : {}] : TRUE)) <=> (([a |-> 1]).a < (1 \div 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09233 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 162 of module random_09233
---*)
