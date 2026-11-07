(*---
description: Evaluates a random set expression, seed 262, number 6084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE) @@ (CHOOSE f \in [{} -> {0} \cup {1}] : TRUE)) : b9370 \in DOMAIN ([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x])} \cap ((([x \in 1..2 |-> x] .. 7) - ([a |-> 1]).a) .. ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
