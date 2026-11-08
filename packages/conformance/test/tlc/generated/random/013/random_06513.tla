(*---
description: Evaluates a random function expression, seed 262, number 6513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b10013 \in (({1} \ 1..3) \cap UNION {{1, 2}, {2, 1, 3}}) |-> (Head(<<>>) % CASE FALSE -> -1 [] OTHER -> 1)] EXCEPT ![([[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + (2147483647 \div [x \in 1..2 |-> x])]).a] = ((<<0, 2147483647>> - LET b10014 == 2 IN b10014) \div (-IF TRUE THEN -1 ELSE 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06513 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
