(*---
description: Evaluates a random bool expression, seed 262, number 113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) EXCEPT ![Len((<<3, 1, 2>> \o <<3, 1, 2>>))] = LET b171 == {b172 \in {} : FALSE} IN (-[x \in 1..2 |-> x])] EXCEPT ![1] = ((CHOOSE f \in [2..1 -> {1, 2}] : TRUE))[Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 62 of module random_00113
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00113 failed.
    Attempted to apply function:
    <<>>
    to argument 2, which is not in the domain of the function.
---*)
