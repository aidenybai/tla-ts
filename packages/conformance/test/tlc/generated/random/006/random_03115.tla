(*---
description: Evaluates a random function expression, seed 262, number 3115.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03115 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~({b4978 \in {} : FALSE} = ({1, 2} \cap {1, 2}))) <=> ([a |-> (0 % {1, 2}), b |-> (FALSE <=> FALSE)] = (CHOOSE r \in [a : {1, 2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03115 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
