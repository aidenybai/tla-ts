(*---
description: Evaluates a random record expression, seed 262, number 8427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((1 * 7) .. LET b13046 == 0 IN 2147483647) = ((CHOOSE b13047 \in 1..3 : TRUE) .. [b13048 \in 1..3 |-> b13048])) EXCEPT !.a = @ + CASE ((TRUE <=> {}) \/ ({x \in 1..3 : x > 1} \subseteq FALSE)) -> Len(Append(<<1, 2>>, 0)) [] OTHER -> (~(\E b13049 \in {} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
