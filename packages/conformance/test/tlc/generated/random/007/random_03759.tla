(*---
description: Evaluates a random set expression, seed 262, number 3759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN [<<5, 6>> EXCEPT ![-1] = 2] \cup {LET b5927 == 7 IN 2 : b5926 \in {b5928 \in {1, 2} : TRUE}}), {((CHOOSE r \in [a : 2..1] : TRUE)).a : b5929 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + (1..3 \cap SUBSET {1})]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 32 to line 14, col 39 of module random_03759
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03759 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
