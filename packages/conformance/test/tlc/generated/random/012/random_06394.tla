(*---
description: Evaluates a random record expression, seed 262, number 6394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Len(<<1>>) .. Head(<<3, 1, 2>>)) \subseteq ({b9836 \in SUBSET {1} : TRUE} \cap {b9837 \in Nat : FALSE})), b |-> ((DOMAIN [x \in 1..2 |-> x] \subseteq {b9838 : b9838 \in {2, 1, 3}}) \/ ((-1 % 7) < IF FALSE THEN 7 ELSE 2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06394 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
