(*---
description: Evaluates a random set expression, seed 262, number 2005.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3175 \in <<((-1 * TRUE) * CASE FALSE -> 3 [] OTHER -> -1), Head([<<3, 1, 2>> EXCEPT ![1] = 3])>> : ((IF TRUE THEN b3175 ELSE b3175 \in UNION {Nat, SUBSET {1}}) <=> (~(\A b3176 \in {1} : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02005 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
