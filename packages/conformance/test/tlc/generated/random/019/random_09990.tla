(*---
description: Evaluates a random record expression, seed 262, number 9990.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09990 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE))[(CHOOSE b15526 \in SUBSET {1} : FALSE)] :> (Len(1) - Len(<<>>))))[IF (Len(<<3, 1, 2>>) = IF FALSE THEN 3 ELSE 7) THEN LET b15527 == ([x \in Nat |-> x + 1])[2] IN (CHOOSE b15528 \in SUBSET {1} : FALSE) ELSE (([x \in Nat |-> x + 1])[2147483647] \div (0 * 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09990 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 71 to line 14, col 106 of module random_09990
---*)
