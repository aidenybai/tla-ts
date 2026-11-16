(*---
description: Evaluates a random bool expression, seed 262, number 4272.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04272 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (UNION {{1, 2}, Nat} \subseteq {b6727 \in 2..1 : FALSE}) -> (UNION {{x \in 1..3 : x > 1}, {}} \ {3, Nat}) [] OTHER -> (((1 :> 2))[7] \div IF [a |-> 1, b |-> TRUE] THEN 1 ELSE -1) = ((Cardinality({1}) * Len(<<1, 2>>)) - (CHOOSE b6728 \in (0 .. 0) : (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04272 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2}
---*)
