(*---
description: Evaluates a random set expression, seed 262, number 1436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[b2299 \in (CHOOSE r \in [a : {1}] : TRUE) |-> Head(<<>>)] EXCEPT ![(CHOOSE b2300 \in UNION {1..3, {2, 1, 3}} : (2..1 \ <<1, 2>>))] = ([[x \in 1..2 |-> x] EXCEPT ![3] = 0])[Head(<<1, 2>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01436 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 93 to line 14, col 152 of module random_01436
---*)
