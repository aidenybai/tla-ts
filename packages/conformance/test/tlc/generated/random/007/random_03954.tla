(*---
description: Evaluates a random int expression, seed 262, number 3954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((-1 .. 1) \cap {b6222 : b6222 \in {2, 1, 3}}) \subseteq ({b6223 : b6223 \in {1, 2}} \cap {b6224 \in {1, 2} : FALSE})) -> Len(Tail(<<[a |-> 1, b |-> TRUE], 7>>)) [] OTHER -> Head(Tail(SubSeq(<<3, 1, 2>>, 2, -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03954 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
