(*---
description: Evaluates a random seq expression, seed 262, number 1298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append([SubSeq(<<1>>, 0, -1) EXCEPT ![1] = ([a |-> 1])[2147483647]], ((3 - 1) \div IF TRUE THEN [a |-> 1, b |-> TRUE] ELSE 0)) \o Append(SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), IF (FALSE <=> [a |-> 1, b |-> TRUE]) THEN LET b2065 == 7 IN {1} ELSE ([a |-> 1] + 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 44 of module random_01298
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
