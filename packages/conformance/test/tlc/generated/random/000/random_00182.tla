(*---
description: Evaluates a random function expression, seed 262, number 182.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00182 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((([x \in 1..2 |-> x] @@ <<5, 6>>) % (0 * 2147483647)) :> (Cardinality({1}) % (CHOOSE b290 \in {x \in 1..3 : x > 1} : TRUE))) EXCEPT ![{((CHOOSE b291 \in Nat : b291) + Head(<<1>>)), Len(<<0, -1>>)}] = ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00182 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
