(*---
description: Evaluates a random set expression, seed 262, number 5813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{Cardinality(1..3) : b8960 \in {2147483647, 2}}, ({1, 2} \cap ({x \in 1..3 : x > 1} \cap {2, 1, 3}))} \cap [[a |-> (FALSE \/ TRUE), b |-> ((1 :> 2) = 1)] EXCEPT !.a = ((0 - 1) % IF FALSE THEN 7 ELSE 1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05813 failed.
    Attempted to check equality of the function <<2>> with the value:
    1
---*)
