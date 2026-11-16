(*---
description: Evaluates a random bool expression, seed 262, number 3479.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03479 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(<<0, 7>>, LAMBDA e : e > 0) = [(CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) EXCEPT ![(2147483647 - 3)] = IF 1..3 THEN 2 ELSE 2147483647]) => (\A b5493 \in {b5494 \in (-1 .. 1) : (2147483647 \in {2, 1, 3})} : (~(b5493 \in {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 60 to line 14, col 100 of module random_03479
    | TRUE
---*)
