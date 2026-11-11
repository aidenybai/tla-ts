(*---
description: Evaluates a random bool expression, seed 262, number 5192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b8051 \in {Cardinality((2147483647 .. 0)) : b8052 \in ((-1 .. 0) \cup (SUBSET {1} \cap {2, 1, 3}))} : (<<(-b8051), (CHOOSE b8053 \in {1} : FALSE)>> = (CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05192 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
