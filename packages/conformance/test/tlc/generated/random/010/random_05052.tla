(*---
description: Evaluates a random set expression, seed 262, number 5052.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7859 \in UNION {[[a |-> 0, b |-> FALSE] EXCEPT !.a = Tail(<<1, 2>>)], {(1 + [a |-> 1]), (\A b7860 \in SUBSET {1} : FALSE)}} : ((CHOOSE r \in [a : 2..1] : TRUE) = [a |-> IF [a |-> 1, b |-> TRUE] THEN 3 ELSE 1, b |-> ([a |-> 1] = [a |-> 1, b |-> TRUE])])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
