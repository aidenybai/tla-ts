(*---
description: Evaluates a random int expression, seed 262, number 6747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2147483647 = 2) => (-1 = -1)) /\ ((3 * 2147483647) \in (2147483647 \div 0))) -> CASE ((\E b10338 \in {1, 2} : FALSE) /\ (TRUE => TRUE)) -> ((CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))[(0 - 2147483647)] [] OTHER -> (-CASE TRUE -> 1 [] OTHER -> 7) [] OTHER -> (CHOOSE b10339 \in {(CHOOSE b10341 \in 2..1 : TRUE) : b10340 \in (2147483647 .. -1)} : (\E b10342 \in (b10339 .. b10339) : ({1, 2} \subseteq 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06747 failed.
    2178:0 Overflow when computing 3*2147483647
---*)
