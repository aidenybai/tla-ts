(*---
description: Evaluates a random set expression, seed 262, number 2083.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((2 \div 7) .. {b3315 \in 2..1 : [a |-> 1]}) \subseteq {LET b3316 == 1 IN 2, CASE FALSE -> 7 [] OTHER -> 0}) THEN (-([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]).a) ELSE IF (\A b3317 \in {b3318 \in SUBSET {1} : FALSE} : ([a |-> 1] = [a |-> 1])) THEN (IF TRUE THEN 3 ELSE 2147483647 :> ((1 :> 2))[7]) ELSE Len(Append(<<1, 2>>, 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
