(*---
description: Evaluates a random set expression, seed 262, number 8414.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08414 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13021 \in ((([x \in 1..2 |-> x] @@ (1 :> 2)))[Len(<<1, 2>>)] .. (IF FALSE THEN 7 ELSE (1 :> 2) - (-2147483647))) : (~((FALSE <=> TRUE) <=> (2..1 => <<1>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08414 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
