(*---
description: Evaluates a random set expression, seed 262, number 1537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [2..1 -> {}] : TRUE), {([[a |-> 1] EXCEPT !.a = @ + b2443]).a : b2443 \in (UNION {1..3, {2, 1, 3}} \cup ({1, 2} \ SUBSET {1}))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01537 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
