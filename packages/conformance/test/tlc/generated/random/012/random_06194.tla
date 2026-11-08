(*---
description: Evaluates a random record expression, seed 262, number 6194.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06194 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(SubSeq(Tail(<<>>), (<<1>> + 7), (3 \div 0))), b |-> ((SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = [<<5, 6>> EXCEPT ![2] = -1]) /\ (<<0, 1>> = [b9541 \in {2, 1, 3} |-> 0]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06194 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
