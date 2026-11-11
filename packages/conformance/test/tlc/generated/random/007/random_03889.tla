(*---
description: Evaluates a random set expression, seed 262, number 3889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (([a |-> 1, b |-> TRUE]).a \in (SUBSET {1} \cap {x \in 1..3 : x > 1})) -> CASE (0 = 3) -> Cardinality({}) [] OTHER -> (7 % 2147483647) [] OTHER -> Len(SortSeq(<<1>>, LAMBDA p, q : p < q)), Len(Append([<<1, 2>> EXCEPT ![1] = -1], Head(<<3, 1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03889 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
