(*---
description: Evaluates a random int expression, seed 262, number 1389.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01389 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (-2147483647) -> (1 + 7) [] OTHER -> (-1 + 1) :> (-CASE FALSE -> 3 [] OTHER -> 3)))[DOMAIN [b2216 \in {b2217 \in {} : FALSE} |-> Head(<<>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01389 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 24 to line 14, col 34 of module random_01389
---*)
