(*---
description: Evaluates a random set expression, seed 262, number 8923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b13835 \in (([a |-> 1]).a .. (<<>> \o <<3, 1, 2>>)) : UNION {{b13836 \in {1} : FALSE}, ({1, 2} \cap {x \in 1..3 : x > 1})}) .. IF {(2147483647 + <<1>>) : b13837 \in (1..3 \ SUBSET {1})} THEN ((-1 * 2) \div (1 * 0)) ELSE ((1 :> 2))[([a |-> 1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
