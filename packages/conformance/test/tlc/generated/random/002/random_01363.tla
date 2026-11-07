(*---
description: Evaluates a random set expression, seed 262, number 1363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b2173 \in UNION {(3 .. 3), (1 .. <<5, 6>>)} : ((TRUE \/ TRUE) /\ (\E b2174 \in {2, 1, 3} : TRUE))) .. (([[x \in 1..2 |-> x] EXCEPT ![0] = 1] @@ [b2175 \in SUBSET {1} |-> b2175]))[LET b2176 == (2147483647 * 3) IN Cardinality(SUBSET {1})]))
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
