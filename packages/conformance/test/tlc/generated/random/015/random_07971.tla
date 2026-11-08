(*---
description: Evaluates a random int expression, seed 262, number 7971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((Nat \cup 1..3) \ (Nat \cap 1..3)) \subseteq DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![FALSE] = 3]) THEN (((3 :> 2))[([x \in Nat |-> x + 1])[2]] + SortSeq(<<2147483647, 0>>, LAMBDA p, q : p < q)) ELSE (Cardinality((FALSE /\ TRUE)) * SelectSeq(<<3, 0>>, LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07971 failed.
    2158:0 Attempted to check if the value:
    FALSE
    is an element of Nat.
---*)
