(*---
description: Evaluates a random int expression, seed 262, number 9831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b15263 == ([a |-> CASE FALSE -> 7 [] OTHER -> 2147483647, b |-> (2..1 = {2, 1, 3})]).a IN ((CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE))[([b15264 \in {x \in 1..3 : x > 1} |-> 0])[((1 :> 2))[7]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09831 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
