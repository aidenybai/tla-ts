(*---
description: Evaluates a random seq expression, seed 262, number 8451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SortSeq(Tail(<<>>), LAMBDA p, q : p < q) EXCEPT ![1] = (Len(<<>>) % ([a |-> 1]).a)], (CHOOSE b13079 \in {CASE [x \in 1..2 |-> x] -> 1 [] OTHER -> 3, (2 * 1)} : ({3 : b13080 \in {}} \subseteq ([a |-> 1, b |-> TRUE] = [x \in Nat |-> x + 1]))), Cardinality(UNION {(SUBSET {1} \ Nat), {b13081 \in {1} : FALSE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
