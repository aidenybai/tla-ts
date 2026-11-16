(*---
description: Evaluates a random function expression, seed 262, number 4187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6587 \in (UNION {DOMAIN (1 :> 2), UNION {1..3, Nat}} \cap ((7 :> 0) .. ([x \in 1..2 |-> x])[2])) |-> Head(SubSeq((<<3, 1, 2>> \o <<1, 2>>), (b6587 % 1), ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04187 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
