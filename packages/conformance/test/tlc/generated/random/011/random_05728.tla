(*---
description: Evaluates a random set expression, seed 262, number 5728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8812 \in (({1 : b8813 \in 1..3} \cap {7, 3}) \cup ((2 * TRUE) .. CASE TRUE -> 1 [] OTHER -> 0)) : ({b8814 \in (b8812 .. 7) : (FALSE \/ TRUE)} = UNION {{b8815 \in SUBSET {1} : TRUE}, DOMAIN <<5, 6>>})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05728 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
