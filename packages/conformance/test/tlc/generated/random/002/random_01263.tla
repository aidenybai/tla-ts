(*---
description: Evaluates a random set expression, seed 262, number 1263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Head(SelectSeq(<<1>>, LAMBDA e : e > 0)) % SortSeq([<<1>> EXCEPT ![1] = 2147483647], LAMBDA p, q : p < q)), LET b2012 == (CHOOSE b2013 \in (3 .. 2) : ([a |-> 1, b |-> TRUE] = [a |-> 1])) IN (CHOOSE b2014 \in {b2015 \in Nat : TRUE} : (b2014 < 2))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
