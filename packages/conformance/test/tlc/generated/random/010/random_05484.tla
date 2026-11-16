(*---
description: Evaluates a random set expression, seed 262, number 5484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((({} \ 2..1) \cup (-1 .. 2147483647)) \ ({2147483647 : b8482 \in {1}} \cap {-1 : b8483 \in {1, 2}})), DOMAIN (LET b8484 == 1 IN 2 :> (7 + 7))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05484 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
