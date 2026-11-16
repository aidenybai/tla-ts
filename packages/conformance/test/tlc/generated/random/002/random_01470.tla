(*---
description: Evaluates a random bool expression, seed 262, number 1470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b2346 \in {(CHOOSE b2347 \in (SUBSET {1} \cup {x \in 1..3 : x > 1}) : (b2347 \in 2..1)), ((-7) % (-1))} : (((FALSE).a \in Head(<<1, 2>>)) \/ ({2147483647, 1} = {b2346, b2346}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01470 failed.
    Attempted to compare the set {} with the value:
    3
---*)
