(*---
description: Evaluates a random set expression, seed 262, number 416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((7 % 3) - ([a |-> 1, b |-> TRUE] + 7)) .. CASE (-1 < 7) -> IF FALSE THEN 1 ELSE 2 [] OTHER -> (-1 \div 1)), UNION {{b680 \in {b681 \in {1} : FALSE} : (<<>> => FALSE)}, (({2, 1, 3} \ {2, 1, 3}) \cup DOMAIN <<5, 6>>)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00416 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
