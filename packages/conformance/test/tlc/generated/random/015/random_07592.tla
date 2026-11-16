(*---
description: Evaluates a random function expression, seed 262, number 7592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE) @@ [([x \in 1..2 |-> x] @@ (1 :> 2)) EXCEPT ![(3 - 7)] = (7 * 3)]) EXCEPT ![Len(SortSeq(SubSeq(<<1, 2>>, 2147483647, 7), LAMBDA p, q : p < q))] = ((Cardinality(<<1>>) + (2147483647 % 3)) - Head(([x \in Nat |-> x + 1] \o <<>>)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 73 to line 14, col 102 of module random_07592
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 132 of module random_07592
    | <<1, 1>>
---*)
