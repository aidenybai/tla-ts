(*---
description: Evaluates a random bool expression, seed 262, number 3872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6096 \in ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] .. (3 % 7)) : (\E b6097 \in (b6096 .. b6096) : ({x \in 1..3 : x > 1} = 1..3))} <=> (SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (CHOOSE b6098 \in {x \in 1..3 : x > 1} : TRUE), Cardinality({x \in 1..3 : x > 1})) = ((0 - 1) :> (2147483647 - 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03872 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
