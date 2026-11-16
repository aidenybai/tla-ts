(*---
description: Evaluates a random seq expression, seed 262, number 160.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00160 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail((Tail(<<1, 2>>) \o <<7, 1>>)) EXCEPT ![1] = (CHOOSE b247 \in (({x \in 1..3 : x > 1} \cap {1, 2}) \ ({1, 2} \ SUBSET {1})) : (Tail(<<3, 1, 2>>) \o [<<1, 2>> EXCEPT ![1] = 2147483647]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00160 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
