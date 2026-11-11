(*---
description: Evaluates a random function expression, seed 262, number 5738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> {1}] : TRUE) EXCEPT ![(-Head((<<1>> \o <<1>>)))] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = IF TRUE THEN 2 ELSE 3]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 50 of module random_05738
    | <<1, 1>>
---*)
