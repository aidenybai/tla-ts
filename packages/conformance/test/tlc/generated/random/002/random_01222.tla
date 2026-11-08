(*---
description: Evaluates a random function expression, seed 262, number 1222.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01222 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<1, 2>> * 2) % Head(<<>>)) :> (CHOOSE b1960 \in UNION {{1, 2}, {1, 2}} : (\A b1961 \in Nat : FALSE))) @@ ((CASE FALSE -> 1 [] OTHER -> -1 % (1 % -1)) :> ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01222 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
