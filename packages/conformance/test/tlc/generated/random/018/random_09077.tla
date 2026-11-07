(*---
description: Evaluates a random bool expression, seed 262, number 9077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SelectSeq(<<>>, LAMBDA e : e > 0)) < ((CHOOSE r \in [a : {1, 2}] : TRUE)).a) /\ (~(\E b14101 \in UNION {SUBSET {1}, SUBSET {1}} : DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 105 to line 14, col 166 of module random_09077
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 105 to line 14, col 166 of module random_09077
---*)
