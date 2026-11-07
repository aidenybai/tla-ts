(*---
description: Evaluates a random bool expression, seed 262, number 6739.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06739 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[<<5, 6>> EXCEPT ![2] = 2147483647] EXCEPT ![([a |-> 1]).a] = Len(<<1, 2>>)] \o SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q)) = [((2 \div 2) :> CASE TRUE -> 0 [] OTHER -> 1) EXCEPT ![LET b10325 == ({2, 1, 3} \cap SUBSET {1}) IN Cardinality(TRUE)] = Cardinality((Nat = FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
