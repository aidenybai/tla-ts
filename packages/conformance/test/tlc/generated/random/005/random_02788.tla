(*---
description: Evaluates a random bool expression, seed 262, number 2788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE) @@ [([x \in Nat |-> x + 1] @@ (1 :> 2)) EXCEPT ![IF TRUE THEN 2147483647 ELSE 3] = (CHOOSE b4410 \in {} : <<1>>)]) = [a |-> (IF TRUE THEN 0 ELSE 2147483647 * (2147483647 :> -1)), b |-> ((\A b4411 \in {1} : TRUE) \/ (<<1, 2>> = (1 :> 2)))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02788 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 60 of module random_02788
---*)
