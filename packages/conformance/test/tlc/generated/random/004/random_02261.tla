(*---
description: Evaluates a random record expression, seed 262, number 2261.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02261 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Head(<<2147483647, <<5, 6>>>>) % ([<<5, 6>> EXCEPT ![2147483647] = 2147483647] @@ (1 :> 2147483647))), b |-> [a |-> ((7 % (1 :> 2)) * (0 + 2147483647)), b |-> ({b3564 : b3564 \in {1}} \subseteq {1, 2147483647})]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 59 to line 14, col 66 of module random_02261
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02261 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
