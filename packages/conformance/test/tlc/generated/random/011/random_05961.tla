(*---
description: Evaluates a random int expression, seed 262, number 5961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b9193 \in ((1..3 \cap {2, 1, 3}) \ {b9194 \in {1, 2} : TRUE}) |-> (Cardinality({1, 2}) - CASE FALSE -> FALSE [] OTHER -> 0)])[Head(SubSeq(Tail(<<3, 1, 2>>), ([x \in Nat |-> x + 1])[3], ([x \in 1..2 |-> x])[2147483647]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05961 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
