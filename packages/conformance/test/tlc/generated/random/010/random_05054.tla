(*---
description: Evaluates a random function expression, seed 262, number 5054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 - [a |-> 1]) :> LET b7865 == 7 IN 2) @@ [b7866 \in DOMAIN (1 :> 2) |-> (CHOOSE b7867 \in Nat : FALSE)]) @@ (SortSeq([<<5, 6>> EXCEPT ![[a |-> 1, b |-> TRUE]] = 7], LAMBDA p, q : p < q) @@ (Append(<<1>>, 0) @@ ((1 :> 2) @@ <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
