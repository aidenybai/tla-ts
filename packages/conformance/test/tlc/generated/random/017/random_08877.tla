(*---
description: Evaluates a random set expression, seed 262, number 8877.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08877 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(<<2, 1>>) - ([b13748 \in {1} |-> 0])[CASE FALSE -> 2147483647 [] OTHER -> 1]) .. (LET b13749 == (CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE) IN Cardinality(2..1) - CASE ({2, 1, 3} \subseteq {x \in 1..3 : x > 1}) -> LET b13750 == 0 IN 2147483647 [] OTHER -> Len(<<1>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
