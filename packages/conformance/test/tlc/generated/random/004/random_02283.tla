(*---
description: Evaluates a random record expression, seed 262, number 2283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b3598 == Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) IN (CHOOSE b3599 \in ({} \ {2, 1, 3}) : (Nat = SUBSET {1})), b |-> (Cardinality(DOMAIN (1 :> 2)) \/ (SubSeq(<<1, 2>>, 2147483647, <<5, 6>>) = ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02283 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 83 to line 14, col 136 of module random_02283
---*)
