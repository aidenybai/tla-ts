(*---
description: Evaluates a random seq expression, seed 262, number 6433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SelectSeq([<<1>> EXCEPT ![1] = -1], LAMBDA e : e > 0) \o ((<<1>> \o 2) \o <<1, 3>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06433 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2
---*)
