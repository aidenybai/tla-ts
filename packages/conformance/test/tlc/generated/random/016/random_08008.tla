(*---
description: Evaluates a random int expression, seed 262, number 8008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CHOOSE b12359 \in (FALSE .. 1) : (<<1, 2>> = [x \in 1..2 |-> x])), LET b12360 == (CHOOSE b12361 \in Nat : TRUE) IN (-b12360)} \ ((CASE FALSE -> 1 [] OTHER -> 2147483647 .. (2 % 7)) \cup [[a |-> 7, b |-> TRUE] EXCEPT !.a = @ + (1..3 % -1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08008 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
