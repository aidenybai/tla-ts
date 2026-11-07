(*---
description: Evaluates a random function expression, seed 262, number 514.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00514 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b862 \in (0 .. [a |-> 1]) |-> ((1 :> 2))[0]] EXCEPT ![CASE (\E b863 \in Nat : TRUE) -> ([a |-> 1, b |-> TRUE] * 2147483647) [] OTHER -> (7 + 2147483647)] = (Cardinality({1, 2}) * (1 % 7))] @@ [b864 \in [a |-> (0 * 1), b |-> (TRUE /\ TRUE)] |-> (CHOOSE b865 \in (FALSE \/ TRUE) : (-1 :> b864))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
