(*---
description: Evaluates a random int expression, seed 262, number 2461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b3877 \in {2147483647, 7} |-> (<<>> = [x \in 1..2 |-> x])] EXCEPT ![Cardinality(DOMAIN <<5, 6>>)] = Head(Tail(<<>>))])[[[[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + CASE TRUE -> <<>> [] OTHER -> 2] EXCEPT !.a = ((CHOOSE b3878 \in Nat : FALSE) \div LET b3879 == 2 IN -1)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 76 of module random_02461
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02461 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
