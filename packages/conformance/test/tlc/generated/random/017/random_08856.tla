(*---
description: Evaluates a random int expression, seed 262, number 8856.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08856 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b13720 \in UNION {FALSE, SUBSET {1}} : (2147483647 = -1)} \cup {([a |-> 1]).a : b13721 \in ({1} \cup 2..1)}) + (CASE (TRUE <=> TRUE) -> CASE FALSE -> 2147483647 [] OTHER -> 3 [] OTHER -> ([x \in 1..2 |-> x])[-1] % ((Nat = {1}) + (1 % 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08856 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetCupValue to tlc2.value.impl.IntValue
---*)
