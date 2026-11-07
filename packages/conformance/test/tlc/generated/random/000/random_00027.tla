(*---
description: Evaluates a random record expression, seed 262, number 27.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00027 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + ([b39 \in {x \in 1..3 : x > 1} |-> b39])[Cardinality({2, 1, 3})]] EXCEPT !.a = @ + [b40 \in (({x \in 1..3 : x > 1} \cup {1, 2}) \cup {7, 2}) |-> LET b41 == (CHOOSE b42 \in {x \in 1..3 : x > 1} : TRUE) IN (b40 % 7)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
