(*---
description: Evaluates a random function expression, seed 262, number 929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE) EXCEPT ![([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + (<<1, 2>> :> 2147483647)]).a] = ((Len(<<1, 2>>) \div Head(<<3, 1, 2>>)) \div CASE (~FALSE) -> CASE TRUE -> 2 [] OTHER -> 1 [] OTHER -> IF TRUE THEN 0 ELSE 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00929 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
