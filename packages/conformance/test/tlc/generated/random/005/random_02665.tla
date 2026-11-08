(*---
description: Evaluates a random int expression, seed 262, number 2665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4207 == LET b4208 == Len(Append(<<1>>, 2147483647)) IN (Head(<<3, 1, 2>>) * LET b4209 == 2 IN 3) IN (Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) % ((b4207 - b4207) * (-[x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02665 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnLambdaValue to tlc2.value.impl.IntValue
---*)
