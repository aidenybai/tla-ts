(*---
description: Evaluates a random record expression, seed 262, number 2225.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02225 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([a |-> 1, b |-> TRUE]).a % (-1 .. -1)), b |-> ((1..3 \subseteq SUBSET {1}) => ([a |-> 1] \in {}))] EXCEPT !.a = ((Append(<<3, 1, 2>>, 0) + LET b3499 == 3 IN 0) % LET b3500 == (-1 * 3) IN Head(<<>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02225 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
