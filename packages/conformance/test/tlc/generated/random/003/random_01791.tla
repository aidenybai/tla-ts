(*---
description: Evaluates a random function expression, seed 262, number 1791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE) EXCEPT ![Len(<<2, FALSE>>)] = (CHOOSE b2838 \in {0 : b2839 \in {1}} : (FALSE \/ FALSE))] EXCEPT ![(CHOOSE b2840 \in {b2841 \in (3 .. [a |-> 1]) : (FALSE => FALSE)} : (~(~TRUE)))] = (CASE [b2842 \in (1 :> 2) |-> 3] -> Cardinality(2..1) [] OTHER -> (-1) + (LET b2843 == 0 IN b2843 - CASE TRUE -> <<5, 6>> [] OTHER -> 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 59 of module random_01791
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01791 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
