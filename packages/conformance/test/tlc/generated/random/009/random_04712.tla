(*---
description: Evaluates a random set expression, seed 262, number 4712.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04712 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-(([a |-> 1]).a + ([a |-> 1]).a)) : b7374 \in {Head(<<1, b7375>>) : b7375 \in [(<<1, 2>> \o <<1, 2>>) EXCEPT ![1] = (-1 * 0)]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04712 failed.
    TLC encountered a non-enumerable quantifier bound
    <<0, 2, 1, 2>>.
    line 14, col 96 to line 14, col 142 of module random_04712
---*)
