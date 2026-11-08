(*---
description: Evaluates a random record expression, seed 262, number 1781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b2817 \in (({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1}) .. ([a |-> 1]).a) : (~(\A b2818 \in [a |-> 1, b |-> TRUE] : FALSE))), b |-> (((2..1 \ 1..3) \subseteq DOMAIN [x \in 1..2 |-> x]) <=> ((7 \div 2) = (<<5, 6>>)[[a |-> 1, b |-> TRUE]]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01781 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
