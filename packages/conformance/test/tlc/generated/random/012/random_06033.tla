(*---
description: Evaluates a random function expression, seed 262, number 6033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CASE TRUE -> 3 [] OTHER -> 7 - (2 + 1)) :> Len(<<2, 0>>)) EXCEPT ![((LET b9293 == 3 IN b9293 % [<<1, 2>> EXCEPT ![1] = 2]) - ([a |-> 3, b |-> TRUE] - (2147483647 \div 1)))] = ((LET b9294 == 0 IN b9294 + CASE FALSE -> 3 [] OTHER -> 0) % (Len(<<3, 1, 2>>) \div Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06033 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
