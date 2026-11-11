(*---
description: Evaluates a random int expression, seed 262, number 199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (<<0, 1>> = (2147483647 :> 0)) THEN ({b327 : b327 \in 2..1} % Cardinality(Nat)) ELSE ((-0) * (2147483647 - 2147483647)) * (Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) - (Head(<<1>>) * [<<>> EXCEPT ![1] = 2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 202 to line 14, col 205 of module random_00199
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00199 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
