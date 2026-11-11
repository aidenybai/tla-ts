(*---
description: Evaluates a random function expression, seed 262, number 2205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3466 \in ((DOMAIN <<5, 6>> \ (<<>> .. 0)) \cup DOMAIN (3 :> 2)) |-> (-((CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE))[(b3466 % 0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02205 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
