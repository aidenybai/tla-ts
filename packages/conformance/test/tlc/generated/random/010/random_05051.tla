(*---
description: Evaluates a random function expression, seed 262, number 5051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7857 \in {(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) \div IF TRUE THEN <<3, 1, 2>> ELSE 7), Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))} |-> (CHOOSE b7858 \in ({2, 2147483647} \cap (b7857 .. -1)) : ([a |-> 7, b |-> TRUE] = [a |-> {1, 2}, b |-> FALSE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05051 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
