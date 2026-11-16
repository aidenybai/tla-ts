(*---
description: Evaluates a random bool expression, seed 262, number 4204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7, -1} \cup (Nat \cap SUBSET {1})) \subseteq ({0, 0} \cup {2147483647 : b6612 \in {1, 2}})) => (SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) = ((2147483647 :> 2) @@ [[x \in Nat |-> x + 1] EXCEPT ![7] = 2]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
