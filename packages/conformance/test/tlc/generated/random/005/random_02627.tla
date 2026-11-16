(*---
description: Evaluates a random bool expression, seed 262, number 2627.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02627 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b4139 \in ({b4140 \in ({1} \cup SUBSET {1}) : (FALSE /\ FALSE)} \cap (DOMAIN <<5, 6>> \cap {b4141 : b4141 \in {1, 2}})) : ([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = IF FALSE THEN 3 ELSE 1] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02627 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
