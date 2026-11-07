(*---
description: Evaluates a random set expression, seed 262, number 2939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b4657 \in ((<<1, 2>> .. 2) \cup {b4658 \in 2..1 : TRUE}) : ((TRUE => TRUE) \/ (TRUE => FALSE))), CASE ((Nat \subseteq SUBSET {1}) <=> (TRUE <=> TRUE)) -> ([2147483647 EXCEPT !.a = 2147483647]).a [] OTHER -> (LET b4659 == 7 IN 7 \div Len(<<1, 2>>))})
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
