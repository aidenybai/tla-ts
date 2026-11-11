(*---
description: Evaluates a random int expression, seed 262, number 8706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(((<<1, 2>> \o <<1>>) \o Tail(<<1, 2>>))) * [a |-> (Cardinality({}) + (CHOOSE b13484 \in 1..3 : TRUE)), b |-> ((<<>> \o <<1, 2>>) = [<<5, 6>> EXCEPT ![-1] = 1])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 154 to line 14, col 161 of module random_08706
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08706 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
