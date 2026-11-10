(*---
description: Evaluates a random bool expression, seed 262, number 5547.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05547 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(-1 * (1 :> 2)), CASE FALSE -> -1 [] OTHER -> -1} \cup [(<<5, 6>> @@ [x \in 1..2 |-> x]) EXCEPT ![(CHOOSE b8581 \in 1..3 : FALSE)] = (1 + 7)]) = (UNION {(Nat \ 2..1), {1 : b8582 \in SUBSET {1}}} \ UNION {(0 .. -1), ({x \in 1..3 : x > 1} \ 2..1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05547 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
