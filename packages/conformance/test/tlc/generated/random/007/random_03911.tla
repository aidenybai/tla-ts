(*---
description: Evaluates a random function expression, seed 262, number 3911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6166 \in {((<<>> \div 1) \div Head(<<1>>)), (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) @@ [b6167 \in 2..1 |-> b6167])} |-> Cardinality({Len(<<3, 1, 2>>) : b6168 \in (\A b6169 \in {2, 1, 3} : TRUE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03911 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
