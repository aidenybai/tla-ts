(*---
description: Evaluates a random seq expression, seed 262, number 5100.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05100 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), (-Cardinality(SUBSET {1}))>> EXCEPT ![1] = ((DOMAIN (1 :> 2) \cup (2 .. -1)) + (CHOOSE b7937 \in ({} \cap 1..3) : ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05100 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 147 to line 14, col 228 of module random_05100
---*)
