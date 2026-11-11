(*---
description: Evaluates a random int expression, seed 262, number 2730.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02730 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4308 == LET b4309 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] \div Len(<<1>>)) IN LET b4310 == LET b4311 == b4309 IN b4309 IN CASE TRUE -> b4310 [] OTHER -> b4310 IN Cardinality(({2, b4308} \cup DOMAIN [x \in Nat |-> x + 1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02730 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
