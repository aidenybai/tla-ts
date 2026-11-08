(*---
description: Evaluates a random function expression, seed 262, number 9985.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09985 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [2..1 -> 1..2] : TRUE) @@ ([[<<5, 6>> EXCEPT ![0] = 7] EXCEPT ![LET b15523 == 7 IN 2] = (TRUE \/ [a |-> 1, b |-> TRUE])] @@ [b15524 \in ([a |-> 1] .. 1) |-> (b15524 % Nat)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 60 to line 14, col 67 of module random_09985
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09985 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
