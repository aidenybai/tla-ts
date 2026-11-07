(*---
description: Evaluates a random seq expression, seed 262, number 8031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([a |-> (CHOOSE b12392 \in {1, 2} : TRUE), b |-> (2 = 2)]).a, (([[a |-> 1] EXCEPT !.a = @ + -1] * (1 - 1)) * ((3 + -1) * CASE FALSE -> -1 [] OTHER -> 2147483647))>>)
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
