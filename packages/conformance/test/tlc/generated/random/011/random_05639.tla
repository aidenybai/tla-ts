(*---
description: Evaluates a random bool expression, seed 262, number 5639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8710 \in ((UNION {{1, 2}, {x \in 1..3 : x > 1}} \cap ({x \in 1..3 : x > 1} \cup Nat)) \cup ((2 .. {x \in 1..3 : x > 1}) \cap (\A b8711 \in {2, 1, 3} : TRUE))) : (((b8710 \in {}) <=> (b8710 \in Nat)) \/ ((~TRUE) <=> (FALSE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05639 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
