(*---
description: Evaluates a random function expression, seed 262, number 309.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00309 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b518 \in ({1, 2} \ 2..1) : (3 < -1)}, ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] .. ([a |-> 1, b |-> TRUE]).a)} \subseteq (((CHOOSE f \in [{1} -> {1}] : TRUE) @@ (CHOOSE f \in [{} -> {2, 1, 3}] : TRUE)) .. Cardinality({-1, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00309 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
