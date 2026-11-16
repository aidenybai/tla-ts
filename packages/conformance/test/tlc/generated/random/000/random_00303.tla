(*---
description: Evaluates a random seq expression, seed 262, number 303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(<<Len(<<1, 2>>), (-{1, 2})>>, IF (\E b502 \in {x \in 1..3 : x > 1} : FALSE) THEN CASE FALSE -> 2 [] OTHER -> 3 ELSE Head(<<1, 2>>)), ((Len(<<3, 1, 2>>) * (-[x \in Nat |-> x + 1])) + ((2147483647 \div 3) :> LET b503 == 3 IN 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00303 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
