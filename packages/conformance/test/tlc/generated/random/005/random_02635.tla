(*---
description: Evaluates a random function expression, seed 262, number 2635.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02635 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) EXCEPT ![CASE (Cardinality(SUBSET {1}) < CASE FALSE -> 2147483647 [] OTHER -> 3) -> ((3 :> FALSE))[(0 * [a |-> 1])] [] OTHER -> ((1 :> 7))[([a |-> 1]).a]] = Head(SubSeq(LET b4159 == 2 IN 2147483647, CASE FALSE -> 2147483647 [] OTHER -> 0, IF {1} THEN 7 ELSE 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
