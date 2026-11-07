(*---
description: Evaluates a random seq expression, seed 262, number 4259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (CHOOSE b6698 \in {x \in 1..3 : x > 1} : FALSE)] \o <<(-1), (CHOOSE b6699 \in SUBSET {1} : TRUE)>>), IF ({b6700 : b6700 \in SUBSET {1}} \subseteq (2..1 \cap {2, 1, 3})) THEN IF (~TRUE) THEN Head(<<>>) ELSE (-1) ELSE Head((<<>> \o <<3, 1, 2>>)), CASE ({b6701 \in {1} : TRUE} \subseteq {b6702 : b6702 \in {x \in 1..3 : x > 1}}) -> [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Cardinality(Nat)] [] OTHER -> (([a |-> 1, b |-> TRUE]).a * (0 :> 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 58 of module random_04259
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
