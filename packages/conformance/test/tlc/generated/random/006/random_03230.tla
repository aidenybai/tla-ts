(*---
description: Evaluates a random int expression, seed 262, number 3230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5130 \in UNION {DOMAIN (2 :> 3), (({} \cap SUBSET {1}) \cap (SUBSET {1} \cap {1, 2}))} : (((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a \in {(2 % b5130), ([a |-> 1]).a})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03230 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
