(*---
description: Evaluates a random function expression, seed 262, number 1782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2819 \in (DOMAIN [<<5, 6>> EXCEPT ![7] = 7] \cap {IF <<>> THEN 2 ELSE [a |-> 1] : b2820 \in (SUBSET {1} \ 1..3)}) |-> (((CHOOSE r \in [a : 2..1] : TRUE)).a * ((b2819 * b2819) - Head(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 36 to line 14, col 43 of module random_01782
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01782 failed.
    Attempted to check if the value:
    {}
    is in the integer interval 1..3
---*)
