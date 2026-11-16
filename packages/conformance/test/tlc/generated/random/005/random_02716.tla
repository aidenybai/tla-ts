(*---
description: Evaluates a random bool expression, seed 262, number 2716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((Nat \cap {2, 1, 3}) = {b4294 : b4294 \in 2..1})) <=> (~({3, -1} = (Nat \cup 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02716 failed.
    Attempted to enumerate S \cup T when S:
    1..3
    and T:
    Nat
    are not both enumerable
---*)
