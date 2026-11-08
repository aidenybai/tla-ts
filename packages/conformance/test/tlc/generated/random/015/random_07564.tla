(*---
description: Evaluates a random function expression, seed 262, number 7564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11645 \in UNION {{(-3), Cardinality(2..1)}, (UNION {2..1, {x \in 1..3 : x > 1}} \ (TRUE <=> TRUE))} |-> IF (Cardinality({2, 1, 3}) = ([a |-> 1, b |-> TRUE] % b11645)) THEN LET b11646 == IF FALSE THEN 7 ELSE b11645 IN (b11646 % b11645) ELSE ((b11645 + b11645) - CASE TRUE -> b11645 [] OTHER -> b11645)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07564 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    2
    is an element of the boolean TRUE
---*)
