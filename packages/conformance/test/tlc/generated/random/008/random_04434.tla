(*---
description: Evaluates a random set expression, seed 262, number 4434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6978 \in ((LET b6979 == 7 IN 0 + ([a |-> 1]).a) .. CASE ({1, 2} \subseteq 2..1) -> (CHOOSE b6980 \in {} : FALSE) [] OTHER -> ([a |-> 1, b |-> TRUE] - 3)) : ([a |-> (b6978 * b6978), b |-> (b6978 = b6978)] < (-({1, 2} \ {1, 2})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
