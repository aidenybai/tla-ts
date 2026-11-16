(*---
description: Evaluates a random set expression, seed 262, number 1024.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01024 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((UNION {2..1, {1, 2}} \cup ({} \ {1, 2})) \cap ({b1651 \in {x \in 1..3 : x > 1} : FALSE} \ {b1652 \in SUBSET {1} : FALSE})) \ (<<(1 - 0), LET b1653 == -1 IN b1653>> .. CASE (\A b1654 \in 1..3 : TRUE) -> Tail(<<1, 2>>) [] OTHER -> (2 % 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01024 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
