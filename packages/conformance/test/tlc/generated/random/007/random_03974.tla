(*---
description: Evaluates a random bool expression, seed 262, number 3974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6248 \in (DOMAIN <<5, 6>> \cap {b6249 \in {2, 1, 3} : TRUE}) : ((~FALSE) \/ (TRUE \/ FALSE))} = DOMAIN [[b6250 \in 2..1 |-> 0] EXCEPT ![(-1 + 7)] = (1 + 2147483647)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 123 to line 14, col 144 of module random_03974
    | FALSE
---*)
