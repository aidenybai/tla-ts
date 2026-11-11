(*---
description: Evaluates a random function expression, seed 262, number 934.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00934 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 * 3) % (FALSE => TRUE)) :> (Append(<<>>, -1) + Cardinality({1}))) @@ (CHOOSE f \in [{} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00934 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
