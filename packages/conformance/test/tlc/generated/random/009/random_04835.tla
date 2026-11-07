(*---
description: Evaluates a random set expression, seed 262, number 4835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7548 \in (([b7549 \in {1, 2} |-> 2..1])[Cardinality({x \in 1..3 : x > 1})] .. [b7550 \in ({1} \cup {1}) |-> (1..3 \ 2..1)]) : ((Cardinality(1..3) = (b7548 * 0)) <=> (~(TRUE => [a |-> 1, b |-> TRUE])))})
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
