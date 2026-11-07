(*---
description: Evaluates a random record expression, seed 262, number 9205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((-{}) * Head(<<3, 1, 2>>)), b |-> ((2147483647 + 3) \in (3 .. [a |-> 1, b |-> TRUE]))] EXCEPT !.a = CASE ((2..1 \cup {1}) = DOMAIN [x \in 1..2 |-> x]) -> (-(CHOOSE b14291 \in -1 : FALSE)) [] OTHER -> Head(<<3, 2>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
