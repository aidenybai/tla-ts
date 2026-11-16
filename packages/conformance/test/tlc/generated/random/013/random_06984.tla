(*---
description: Evaluates a random function expression, seed 262, number 6984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 * 2147483647) - (\E b10695 \in {x \in 1..3 : x > 1} : TRUE)) % ([(1 :> 2) EXCEPT ![7] = 1])[((1 :> 2))[-1]]) :> (((2147483647 + 3) + <<2147483647, 7>>) + ([(1 :> 2) EXCEPT ![(1 :> 2)] = <<1, 2>>])[CASE FALSE -> 3 [] OTHER -> 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06984 failed.
    2178:0 Overflow when computing 7*2147483647
---*)
