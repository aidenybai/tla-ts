(*---
description: Evaluates a random function expression, seed 262, number 5235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b8110 \in (2147483647 .. <<5, 6>>) |-> Cardinality(Nat)] @@ (Len(<<1, 2>>) :> (CHOOSE b8111 \in {x \in 1..3 : x > 1} : FALSE))) @@ [([[x \in Nat |-> x + 1] EXCEPT ![0] = 3] @@ (1 :> -1)) EXCEPT ![Cardinality(({1, 2} \cup {}))] = ((3 :> 3))[(-1 - <<1>>)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05235 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
