(*---
description: Evaluates a random record expression, seed 262, number 9597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([a |-> 1]).a * (-1..3)), b |-> (LET b14902 == 0 IN 7 = IF FALSE THEN 2 ELSE 2)] EXCEPT !.a = @ + IF (~(2147483647 = [a |-> 1, b |-> TRUE])) THEN Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) ELSE (CHOOSE b14903 \in [FALSE EXCEPT !.a = @ + 1] : (FALSE => SUBSET {1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
