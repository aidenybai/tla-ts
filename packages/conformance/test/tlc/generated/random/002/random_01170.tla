(*---
description: Evaluates a random int expression, seed 262, number 1170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b1871 == ((1 :> 2))[0] IN (<<1, 2>> \o <<1>>) + LET b1872 == (7 - 2147483647) IN CASE FALSE -> b1872 [] OTHER -> b1872) * (((7 \div 1) \div (CHOOSE b1873 \in SUBSET {1} : TRUE)) - IF (\E b1874 \in (1 :> 2) : FALSE) THEN (CHOOSE b1875 \in {1, 2} : FALSE) ELSE (7 + -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01170 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
