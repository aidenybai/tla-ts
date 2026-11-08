(*---
description: Evaluates a random function expression, seed 262, number 9595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) @@ (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE)) @@ [(1 :> -1) EXCEPT ![(<<>> * 7)] = (2 - 1)]) EXCEPT ![Len((Tail(<<3, 1, 2>>) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))] = (-(((1 :> 2) @@ (1 :> 2)))[LET b14899 == 3 IN b14899])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09595 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
