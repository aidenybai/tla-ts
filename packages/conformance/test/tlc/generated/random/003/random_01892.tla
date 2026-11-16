(*---
description: Evaluates a random int expression, seed 262, number 1892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b2969 \in (({3, -1} \cup (SUBSET {1} \ Nat)) \cup {(-0) : b2970 \in UNION {{2, 1, 3}, {}}}) : ((Append(<<1>>, b2969) = [b2971 \in 1..3 |-> b2971]) \/ ((CHOOSE b2972 \in SUBSET {1} : FALSE) = ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01892 failed.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
