(*---
description: Evaluates a random record expression, seed 262, number 3948.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03948 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(({1} \cap SUBSET {1})), b |-> ((2147483647 = 1) /\ (\E b6211 \in {x \in 1..3 : x > 1} : TRUE))] EXCEPT !.a = @ + ((-(CHOOSE b6212 \in Nat : TRUE)) - (-(-1 - 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03948 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
