(*---
description: Evaluates a random int expression, seed 262, number 5239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(CHOOSE b8117 \in UNION {({} \ Nat), ({2, 1, 3} \ SUBSET {1})} : ((CHOOSE r \in [a : 2..1] : TRUE) = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05239 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
