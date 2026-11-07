(*---
description: Evaluates a random record expression, seed 262, number 1186.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01186 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (<<5, 6>>)[[x \in 1..2 |-> x]], b |-> (<<1>> = <<5, 6>>)] EXCEPT !.a = @ + ((0 :> -1))[(0 \div 7)]] EXCEPT !.a = @ + Len([Append(<<3, 1, 2>>, 3) EXCEPT ![1] = (7 + 2147483647)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01186 failed.
    Attempted to access tuple at a non integral index: <<1, 2>>
---*)
