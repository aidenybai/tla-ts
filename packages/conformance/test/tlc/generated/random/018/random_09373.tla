(*---
description: Evaluates a random int expression, seed 262, number 9373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE SortSeq([SelectSeq(2, LAMBDA e : e > 0) EXCEPT ![1] = Head(<<3, 1, 2>>)], LAMBDA p, q : p < q) -> Len((SortSeq(<<>>, LAMBDA p, q : p < q) \cap ({2, 1, 3} \ {1}))) [] OTHER -> ((([a |-> 1, b |-> TRUE] \cup <<1, 2>>) \subseteq {b14550 : b14550 \in {2, 1, 3}}) \/ (~(0 = [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    2
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    2
---*)
