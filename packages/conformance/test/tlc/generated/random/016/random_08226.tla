(*---
description: Evaluates a random bool expression, seed 262, number 8226.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08226 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b12726 \in UNION {(UNION {2..1, {1}} \cap {1, 2147483647}), UNION {UNION {<<3, 1, 2>>, {x \in 1..3 : x > 1}}, (2147483647 .. 2147483647)}} : (\E b12727 \in ({b12728 \in {2, 1, 3} : TRUE} \cap {b12726 : b12729 \in {x \in 1..3 : x > 1}}) : ({b12730 \in Nat : TRUE} = ({2, 1, 3} \cup 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08226 failed.
    Attempted to compare the set {2, 3} with the value:
    <<3, 1, 2>>
---*)
