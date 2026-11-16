(*---
description: Evaluates a random bool expression, seed 262, number 4504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head((<<1>> \o <<1>>)) \in ((<<3, 1, 2>> = <<>>) \cup {b7076 \in SUBSET {1} : TRUE})) \/ (\E b7077 \in {(2147483647 - 2147483647) : b7078 \in {2147483647, 2147483647}} : (([a |-> 1] + 1) \in {b7079 \in SUBSET {1} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04504 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
