(*---
description: Evaluates a random function expression, seed 262, number 5325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality((0 .. 1)) :> ((2147483647 \div 7) - (2147483647 - 3))) EXCEPT ![([[<<5, 6>> EXCEPT ![3] = 0] EXCEPT ![(2147483647 * 7)] = (-1 + {1, 2})] % ((-1 - [a |-> 1, b |-> TRUE]) \div (-7)))] = CASE ((0 + 1) = (CHOOSE b8236 \in {1} : TRUE)) -> ((CHOOSE b8237 \in 1..3 : FALSE) - (0 - -1)) [] OTHER -> ([b8238 \in 2..1 |-> b8238])[Len(<<1>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 97 to line 14, col 104 of module random_05325
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05325 failed.
    2178:0 Overflow when computing 2147483647*7
---*)
