(*---
description: Evaluates a random set expression, seed 262, number 8658.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08658 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13399 \in ((CHOOSE b13400 \in {b13401 \in 1..3 : TRUE} : (\A b13402 \in {2, 1, 3} : FALSE)) .. ([(1 :> 2) EXCEPT ![2] = 3])[Len(SUBSET {1})]) : (Len(Append(<<3, 1, 2>>, -1)) = (([x \in Nat |-> x + 1] @@ (1 :> 2)))[(\E b13403 \in {1, 2} : FALSE)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08658 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 107 of module random_08658
---*)
