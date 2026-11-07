(*---
description: Evaluates a random function expression, seed 262, number 3075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE <=> TRUE) => (\A b4883 \in FALSE : FALSE)) :> (IF FALSE THEN -1 ELSE 1 \div (-FALSE))) @@ ((CHOOSE b4884 \in {3, 7} : (FALSE \/ {1, 2})) :> (CASE TRUE -> -1 [] OTHER -> 3 % (3 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
