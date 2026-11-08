(*---
description: Evaluates a random function expression, seed 262, number 2893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4578 \in {b4579 \in (Len(<<>>) .. (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) : (({2, 1, 3} \cap TRUE) \/ (\E b4580 \in {} : FALSE))} |-> ((([a |-> 1, b |-> TRUE] @@ <<5, 6>>) @@ (<<3, 1, 2>> @@ [x \in Nat |-> x + 1])))[[(CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT !.a = Len(<<3, 1, 2>>)]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02893 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
