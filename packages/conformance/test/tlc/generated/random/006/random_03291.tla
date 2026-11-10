(*---
description: Evaluates a random function expression, seed 262, number 3291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (2 - -1), b |-> (TRUE => FALSE)] EXCEPT !.a = @ + ((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))[([a |-> 1] \div 1)]] EXCEPT !.a = @ + (((3 :> 7) @@ [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = -1]))[DOMAIN (CHOOSE f \in [{1, 2} -> 1..2] : TRUE)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03291 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 121 of module random_03291
---*)
