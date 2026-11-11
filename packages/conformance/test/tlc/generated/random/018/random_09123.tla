(*---
description: Evaluates a random set expression, seed 262, number 9123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b14168 \in {b14169 \in {2, -1} : (b14169 = 2)} : (([a |-> 1] = [a |-> 1]) \/ (TRUE => TRUE))} \cup (({2147483647 : b14170 \in {1}} \cup ({x \in 1..3 : x > 1} .. 2)) \cap (UNION {{1}, SUBSET {1}} \cup {3 : b14171 \in 2..1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09123 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
