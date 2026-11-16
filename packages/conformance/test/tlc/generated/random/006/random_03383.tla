(*---
description: Evaluates a random function expression, seed 262, number 3383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b5370 \in {Head(<<1>>) : b5371 \in {b5372 \in {} : TRUE}} |-> IF (\A b5373 \in [x \in 1..2 |-> x] : FALSE) THEN Head(<<1, 2>>) ELSE (7 * 2147483647)] @@ ([b5374 \in {b5375 : b5375 \in {}} |-> ((1 :> 2))[b5374]] @@ (CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2>>"
---*)
