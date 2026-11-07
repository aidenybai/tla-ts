(*---
description: Evaluates a random set expression, seed 262, number 3708.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03708 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cup (1 .. <<1>>)) \cup (({1, 2} \ 2..1) \cup (2..1 \cup 1..3))) \cap ({(b5858 + b5858) : b5858 \in {b5859 \in Nat : {}}} \cup ({b5860 \in 2..1 : TRUE} \cap (1..3 \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
