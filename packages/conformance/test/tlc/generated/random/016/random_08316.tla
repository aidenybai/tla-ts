(*---
description: Evaluates a random function expression, seed 262, number 8316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-Cardinality(Nat)) :> (([x \in 1..2 |-> x])[2147483647] % (2147483647 * 1))) @@ (((CHOOSE b12871 \in {2, 1, 3} : FALSE) \div ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])) :> Len(Append(<<3, 1, 2>>, [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08316 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
