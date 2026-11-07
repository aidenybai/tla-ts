(*---
description: Evaluates a random set expression, seed 262, number 3689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((3 .. <<5, 6>>) \subseteq ({} \cup {1, 2})) -> (Cardinality({x \in 1..3 : x > 1}) * LET b5827 == 0 IN b5827) [] OTHER -> LET b5828 == (1 * b5826) IN (b5826 \div 3) : b5826 \in (((TRUE \div 1) + ([a |-> 1, b |-> TRUE] \div 1)) .. ([a |-> 7, b |-> TRUE]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
