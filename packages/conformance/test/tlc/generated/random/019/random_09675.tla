(*---
description: Evaluates a random set expression, seed 262, number 9675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((7 \div b15017) % (0 + b15017)) * ((b15017 + b15017) + ((1 :> 2))[3])) : b15017 \in {(CASE FALSE -> 0 [] OTHER -> 0 + CASE TRUE -> 1 [] OTHER -> 1), ((2 % 1) - ([a |-> 1, b |-> TRUE] % 0))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09675 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
