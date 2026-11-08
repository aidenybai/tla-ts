(*---
description: Evaluates a random int expression, seed 262, number 7509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11566 \in ((({2, 1, 3} \subseteq {2, 1, 3}) .. (2147483647 - (1 :> 2))) \cap DOMAIN (CHOOSE f \in [{1, 2} -> 1..2] : TRUE)) : ([[a |-> 7, b |-> TRUE] EXCEPT !.a = (b11566 \div 2)] = [a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (b11566 < b11566)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07509 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
