(*---
description: Evaluates a random record expression, seed 262, number 4445.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04445 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((1 \div 3) + Len(<<1>>)), b |-> (({} = SUBSET {1}) => (7 \subseteq [x \in 1..2 |-> x]))] EXCEPT !.a = @ + [[b6994 \in {3, 2147483647} |-> ([a |-> 1, b |-> TRUE]).a] EXCEPT ![(Head(<<1>>) - CASE TRUE -> 3 [] OTHER -> 0)] = ((-1 % -1) + (7 - 1))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 132 to line 14, col 188 of module random_04445
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04445 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
