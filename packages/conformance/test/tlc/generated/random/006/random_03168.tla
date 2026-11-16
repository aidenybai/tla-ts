(*---
description: Evaluates a random int expression, seed 262, number 3168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (([a |-> 2, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = 0]) => ((1 < -1) => (<<5, 6>>)[2147483647])) -> (CHOOSE b5047 \in {(CHOOSE b5048 \in {} : FALSE), IF TRUE THEN 1 ELSE 2147483647} : (({1, 2} \ {1, 2}) \subseteq (TRUE \ {2, 1, 3}))) [] OTHER -> (-Len(Append(<<3, 1, 2>>, 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03168 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 140 to line 14, col 166 of module random_03168
---*)
