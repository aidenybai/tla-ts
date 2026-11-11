(*---
description: Evaluates a random bool expression, seed 262, number 1285.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01285 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(\A b2045 \in {b2046 \in {1} : TRUE} : (TRUE <=> TRUE))) \/ ((IF FALSE THEN 0 ELSE -1 * Len(<<1, 2>>)) \in {CASE FALSE -> b2047 [] OTHER -> b2047 : b2047 \in ([x \in 1..2 |-> x] \cap 1..3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01285 failed.
    Attempted to check if the value:
    1
    is an element of the function <<1, 2>>
---*)
