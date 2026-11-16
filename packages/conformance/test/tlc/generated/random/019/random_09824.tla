(*---
description: Evaluates a random function expression, seed 262, number 9824.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09824 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b15252 == IF TRUE THEN 7 ELSE -1 IN [a |-> 2, b |-> TRUE] :> (-(2 % 7))) @@ [(CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) EXCEPT ![((<<5, 6>>)[0] * (TRUE - 1))] = (CHOOSE b15253 \in (TRUE \cup {x \in 1..3 : x > 1}) : (b15253 < b15253))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09824 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 100 to line 14, col 138 of module random_09824
---*)
