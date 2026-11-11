(*---
description: Evaluates a random function expression, seed 262, number 1751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2782 \in (Append(<<2147483647, -1>>, Head(<<3, 1, 2>>)) .. Head((<<1, 2>> \o <<1, 2>>))) |-> ((-LET b2783 == 1 IN b2782) \div ((-b2782) - Cardinality(1..3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01751 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
