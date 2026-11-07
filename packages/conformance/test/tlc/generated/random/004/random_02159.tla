(*---
description: Evaluates a random seq expression, seed 262, number 2159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((-7) + LET b3410 == -1 IN b3410) \div ((1 .. -1) \ {b3411 : b3411 \in {x \in 1..3 : x > 1}})), (CASE (FALSE <=> TRUE) -> Len(<<>>) [] OTHER -> CASE TRUE -> 2147483647 [] OTHER -> 2147483647 - Head(SelectSeq(<<>>, LAMBDA e : e > 0)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
