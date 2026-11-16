(*---
description: Evaluates a random bool expression, seed 262, number 4339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6832 \in {b6833 \in ({b6834 \in SUBSET {1} : FALSE} \cap ({1} \ {x \in 1..3 : x > 1})) : (~(TRUE /\ TRUE))} : (~(~(\A b6835 \in 2..1 : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04339 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
