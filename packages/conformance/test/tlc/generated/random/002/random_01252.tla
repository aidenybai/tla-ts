(*---
description: Evaluates a random record expression, seed 262, number 1252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Len(<<1>>) \div (2147483647 % 7)) - (([x \in 1..2 |-> x] - 2) % LET b2002 == -1 IN b2002)), b |-> ((\A b2003 \in ({2, 1, 3} \ {}) : (SUBSET {1} \subseteq {2, 1, 3})) => (([a |-> 1, b |-> TRUE] = [a |-> 1]) => (TRUE /\ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01252 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
