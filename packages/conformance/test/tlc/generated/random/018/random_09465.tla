(*---
description: Evaluates a random record expression, seed 262, number 9465.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09465 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + ([a |-> 1]).a] EXCEPT !.a = @ + LET b14709 == IF TRUE THEN 1 ELSE 2 IN (1 - b14709)] EXCEPT !.a = (CASE (0 = 3) -> (0 - 7) [] OTHER -> (FALSE * {2, 1, 3}) + (LET b14710 == TRUE IN -1 \div Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09465 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
