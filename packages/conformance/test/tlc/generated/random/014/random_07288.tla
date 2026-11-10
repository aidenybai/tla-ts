(*---
description: Evaluates a random bool expression, seed 262, number 7288.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07288 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b11225 == ((CHOOSE f \in [1..2 -> 1..2] : TRUE))[(LET b11226 == 2147483647 IN 7 * CASE [a |-> 1, b |-> TRUE] -> 7 [] OTHER -> 3)] IN (Head(Tail(<<1>>)) * ((CHOOSE b11227 \in {1} : FALSE) - ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07288 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
