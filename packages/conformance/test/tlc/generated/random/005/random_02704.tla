(*---
description: Evaluates a random set expression, seed 262, number 2704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4275 \in (((CHOOSE f \in [{1} -> 1..2] : TRUE) .. (1 + 7)) \cap {(3 % <<1, 2>>), Cardinality(2..1)}) : ((\A b4276 \in DOMAIN TRUE : (-b4275)) <=> (\A b4277 \in UNION {{1, 2}, 2..1} : ({x \in 1..3 : x > 1} \subseteq Nat)))})
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
