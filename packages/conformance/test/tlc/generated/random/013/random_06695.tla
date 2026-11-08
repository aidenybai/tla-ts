(*---
description: Evaluates a random record expression, seed 262, number 6695.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06695 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({(2 - 0), CASE TRUE -> 1 [] OTHER -> 2147483647} \ {Len(<<1>>), ([x \in 1..2 |-> x] \div 3)}), ((UNION {{}, {1, 2}} \cup ({} \ {1, 2})) \cap ([[a |-> 1] EXCEPT !.a = @ + 2147483647] \cap [[a |-> 1] EXCEPT !.a = 1]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06695 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
