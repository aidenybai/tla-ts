(*---
description: Evaluates a random record expression, seed 262, number 7685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (([b11839 \in 2..1 |-> b11839])[(1 \div 0)] * Head((<<1>> \o <<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07685 failed.
    2179:0 The second argument of \div is 0.
---*)
