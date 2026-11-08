(*---
description: Evaluates a random int expression, seed 262, number 6807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((Head(<<>>) :> CASE FALSE -> -1 [] OTHER -> -1))[IF (\A b10438 \in {1} : FALSE) THEN (2147483647 % 1) ELSE Cardinality({1, 2})], Len(([<<1, 2>> EXCEPT ![1] = 2147483647] \o [<<1, 2>> EXCEPT ![1] = 2]))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06807 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
