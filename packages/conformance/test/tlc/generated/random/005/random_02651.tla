(*---
description: Evaluates a random int expression, seed 262, number 2651.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02651 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4184 == Head({b4185 \in (0 - 0) : (7 \in 2..1)}) IN Cardinality(UNION {(b4184 .. b4184), {b4186 \in SUBSET {1} : FALSE}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02651 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {b4185 \in 0 : <expression line 14, col 56 to line 14, col 65 of module random_02651> }
---*)
