(*---
description: Evaluates a random int expression, seed 262, number 1624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2591 == IF (\E b2592 \in {1, 2} : (~TRUE)) THEN Len(SortSeq(TRUE, LAMBDA p, q : p < q)) ELSE Cardinality([b2593 \in SUBSET {1} |-> b2593]) IN IF (([a |-> 1]).a = (b2591 + 2147483647)) THEN (CHOOSE b2594 \in {-1, 2147483647} : (Nat \subseteq 1..3)) ELSE ((b2591 :> 0))[LET b2595 == 2147483647 IN b2595])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01624 failed.
    2181:0 Attempted to compute cardinality of the value
    ({} :> {} @@ {1} :> {1})
---*)
