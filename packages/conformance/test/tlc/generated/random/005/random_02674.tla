(*---
description: Evaluates a random record expression, seed 262, number 2674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Cardinality({1, 2}) + [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]), b |-> ((TRUE <=> TRUE) \/ (TRUE /\ FALSE))] EXCEPT !.a = @ + (LET b4223 == (-1 \div 3) IN (b4223 % 7) % CASE (2147483647 \in {}) -> (CHOOSE b4224 \in Nat : FALSE) [] OTHER -> Cardinality([x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
