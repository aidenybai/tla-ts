(*---
description: Evaluates a random set expression, seed 262, number 5098.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Len(<<1, 2>>) - (CHOOSE b7930 \in Nat : FALSE)) % [(<<1, 2>> \o <<1>>) EXCEPT ![1] = (CHOOSE b7931 \in {2, 1, 3} : FALSE)]) : b7929 \in ({(2 * [x \in 1..2 |-> x]), (1 + -1)} \cup ((-[a |-> 1]) .. (CHOOSE b7932 \in <<1>> : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05098 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
