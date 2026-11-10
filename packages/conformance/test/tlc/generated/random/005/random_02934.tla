(*---
description: Evaluates a random set expression, seed 262, number 2934.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02934 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([a |-> 2, b |-> TRUE]).a \div (IF TRUE THEN 7 ELSE -1 % Len({x \in 1..3 : x > 1}))) : b4644 \in (([[a |-> 1] EXCEPT !.a = @ + -1]).a .. ((CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE) @@ ((1 :> 2) @@ (1 :> 2))))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02934 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
