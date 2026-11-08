(*---
description: Evaluates a random seq expression, seed 262, number 5059.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05059 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([Append(<<3, 1, 2>>, 0) EXCEPT ![1] = Cardinality(2..1)] * ((7 - 0) % CASE FALSE -> 7 [] OTHER -> 2)) \o SelectSeq(Tail(Append(<<1>>, 2)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05059 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
