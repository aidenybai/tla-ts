(*---
description: Evaluates a random bool expression, seed 262, number 1585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b2528 \in ({(-1 * 2), (7 + -1)} \ (DOMAIN (1 :> 2) \cap ({2, 1, 3} \ 1..3))) : ([(CHOOSE f \in [{1, 2} -> 2..1] : TRUE) EXCEPT ![Len(TRUE)] = {b2529 \in {1, 2} : FALSE}] = CASE [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b2528] -> (-b2528) [] OTHER -> ([x \in 1..2 |-> x])[2147483647])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01585 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 102 to line 14, col 137 of module random_01585
---*)
