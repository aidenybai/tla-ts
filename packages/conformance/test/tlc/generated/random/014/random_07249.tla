(*---
description: Evaluates a random record expression, seed 262, number 7249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b11148 == Head(<<1, 2>>) IN (2 \div FALSE), b |-> ((-1 < 2) \/ (2147483647 = -1))] EXCEPT !.a = @ + CASE (~([a |-> 1] = [a |-> 1])) -> (([a |-> 1]).a % (7 + 2147483647)) [] OTHER -> (CHOOSE b11149 \in {7, 2147483647} : (\A b11150 \in SUBSET {1} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
