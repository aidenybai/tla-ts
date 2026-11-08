(*---
description: Evaluates a random function expression, seed 262, number 2746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b4333 \in {FALSE : b4334 \in 1..3} : (~FALSE)) % Len((<<>> \o <<>>))) :> CASE ((-1 - -1) \in {7, 2147483647}) -> (-LET b4335 == 7 IN b4335) [] OTHER -> ((CHOOSE b4336 \in 1..3 : TRUE) % (0 - [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02746 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
