(*---
description: Evaluates a random function expression, seed 262, number 6335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(CHOOSE f \in [2..1 -> {}] : TRUE) EXCEPT ![(1 - 2147483647)] = Cardinality({2, 1, 3})] @@ [(<<5, 6>> @@ (1 :> 2)) EXCEPT ![(0 + [x \in 1..2 |-> x])] = Append([a |-> 1, b |-> TRUE], <<1, 2>>)]) EXCEPT ![(([[a |-> 1] EXCEPT !.a = 1]).a - (CHOOSE r \in [a : {1, 2}] : TRUE))] = SubSeq(SelectSeq(Append(<<1, 2>>, 7), LAMBDA e : e > 0), ((CHOOSE r \in [a : 2..1] : TRUE)).a, LET b9736 == CASE FALSE -> 7 [] OTHER -> 1 IN (CHOOSE b9737 \in {1} : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 51 of module random_06335
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
