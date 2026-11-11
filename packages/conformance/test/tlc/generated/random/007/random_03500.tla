(*---
description: Evaluates a random function expression, seed 262, number 3500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<>>, LAMBDA p, q : p < q)) :> ((-1 * [a |-> 1, b |-> TRUE]) \div Cardinality(1))) @@ [(Len(<<1, 2>>) :> (3 * 1)) EXCEPT ![(([a |-> 1, b |-> TRUE]).a - IF FALSE THEN 2147483647 ELSE 3)] = LET b5528 == (2147483647 \div 7) IN Cardinality(2..1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03500 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
