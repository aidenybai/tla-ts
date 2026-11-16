(*---
description: Evaluates a random bool expression, seed 262, number 4839.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04839 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + CASE ({1, 2} \subseteq {1}) -> (-3) [] OTHER -> (0 - -1)] = [[[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + [(1 :> 2) EXCEPT ![-1] = 1]] EXCEPT !.a = ((0 - 7) % ([a |-> 1, b |-> TRUE]).a)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 172 to line 14, col 177 of module random_04839
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04839 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
