(*---
description: Evaluates a random set expression, seed 262, number 215.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00215 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b349 \in {1 : b350 \in 2..1} : (TRUE = {1})) % Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) .. (-((<<5, 6>>)[2] % (0 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00215 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
