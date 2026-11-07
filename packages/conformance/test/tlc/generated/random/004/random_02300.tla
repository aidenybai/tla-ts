(*---
description: Evaluates a random set expression, seed 262, number 2300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [(Len(<<3, 1, 2>>) :> (-1 + 3)) EXCEPT ![((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a] = Len((TRUE \o <<1>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 52 of module random_02300
    | {3}
---*)
