(*---
description: Evaluates a random function expression, seed 262, number 8870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13736 \in {(CASE FALSE -> 1 [] OTHER -> b13737 * LET b13738 == 0 IN b13737) : b13737 \in (IF FALSE THEN 2147483647 ELSE -1 .. [a |-> -1, b |-> TRUE])} |-> CASE (\A b13739 \in (SUBSET {1} \cap SUBSET {1}) : (<<1, 2>> /\ TRUE)) -> IF (b13736 < b13736) THEN [(1 :> 2) EXCEPT ![0] = b13736] ELSE (0 - b13736) [] OTHER -> Cardinality(({2, 1, 3} \cap 2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
