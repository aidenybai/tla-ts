(*---
description: Evaluates a random set expression, seed 262, number 4113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {UNION {(2 .. [a |-> 1, b |-> TRUE]), DOMAIN (1 :> 2)}, {b6460 \in (-1 .. 7) : (TRUE \/ FALSE)}} \cup {IF (\A b6461 \in TRUE : TRUE) THEN (0 * 2) ELSE (CHOOSE b6462 \in 2..1 : TRUE), (((1 :> 2) @@ [x \in 1..2 |-> x]))[([a |-> 1]).a]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04113 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
