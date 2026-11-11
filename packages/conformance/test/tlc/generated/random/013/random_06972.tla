(*---
description: Evaluates a random bool expression, seed 262, number 6972.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06972 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<1>>) % (CHOOSE b10666 \in {2, 1, 3} : TRUE)) + Cardinality((2147483647 .. 2147483647))) \in ([b10667 \in ([a |-> 1, b |-> TRUE] .. 3) |-> ([a |-> 1]).a] @@ (CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06972 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
