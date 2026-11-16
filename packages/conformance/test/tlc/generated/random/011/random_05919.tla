(*---
description: Evaluates a random int expression, seed 262, number 5919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(([(<<3, 1, 2>> \o <<1>>) EXCEPT ![1] = (1 - -1)] \o ([<<1, 2>> EXCEPT ![1] = 3] \o [<<1>> EXCEPT ![1] = 3]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 7"
---*)
