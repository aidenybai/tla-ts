(*---
description: Evaluates a random int expression, seed 262, number 1487.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01487 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2379 == Head(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) IN ([([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) EXCEPT ![Cardinality(1..3)] = ([x \in Nat |-> x + 1] = [x \in 1..2 |-> x])])[(IF FALSE THEN b2379 ELSE -1 * CASE FALSE -> 3 [] OTHER -> b2379)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 86 to line 14, col 125 of module random_01487
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01487 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument -2, which is not in the domain of the function.
---*)
