(*---
description: Evaluates a random set expression, seed 262, number 600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({0, 2} \cup {b1006 \in {1} : TRUE}) \cup (UNION {[a |-> 1, b |-> TRUE], {}} \cap ({2, 1, 3} \cup {}))) \cup {((2147483647 + 0) + (-TRUE)), Len(SortSeq(<<1>>, LAMBDA p, q : p < q))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00600 failed.
    Attempted to compare the set {} with the value:
    [a |-> 1, b |-> TRUE]
---*)
