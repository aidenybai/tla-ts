(*---
description: Evaluates a random bool expression, seed 262, number 6614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (TRUE <=> FALSE) THEN CASE FALSE -> 3 [] OTHER -> -1 ELSE Cardinality(SUBSET {1}) * ((-1 % 1) * IF TRUE THEN [a |-> 1] ELSE 2)) \in {b10146 \in ((7 .. 2) \cup {b10147 \in {1} : FALSE}) : (LET b10148 == <<5, 6>> IN 3 = {b10149 \in {x \in 1..3 : x > 1} : FALSE})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06614 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
