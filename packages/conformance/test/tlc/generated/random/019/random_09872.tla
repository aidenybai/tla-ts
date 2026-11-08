(*---
description: Evaluates a random bool expression, seed 262, number 9872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([Append(<<>>, <<3, 1, 2>>) EXCEPT ![1] = (3 + FALSE)] \in {([a |-> 1, b |-> TRUE]).a, CASE TRUE -> 7 [] OTHER -> 7}) <=> [a |-> (-(-1 \div 7)), b |-> [b15337 \in ({2, 1, 3} \ {1}) |-> (b15337 % b15337)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09872 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
