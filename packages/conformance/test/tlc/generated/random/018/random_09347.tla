(*---
description: Evaluates a random function expression, seed 262, number 9347.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09347 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [1..2 -> 2..1] : TRUE) @@ [b14505 \in {2147483647, 2147483647} |-> ([a |-> 1, b |-> TRUE]).a]) @@ ([(CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE) EXCEPT ![(0 + -1)] = (-7)] @@ ((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE) @@ [[x \in Nat |-> x + 1] EXCEPT ![3] = 2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09347 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 52 of module random_09347
---*)
