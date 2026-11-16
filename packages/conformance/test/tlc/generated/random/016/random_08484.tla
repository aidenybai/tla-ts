(*---
description: Evaluates a random int expression, seed 262, number 8484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (LET b13132 == (2147483647 \div 7) IN Append(<<1, 2>>, 2147483647) <=> (~(2 \in {}))) -> (((2 + 2147483647) \div ((1 :> 2)).a) * Head((<<3, 1, 2>> \o <<3, 1, 2>>))) [] OTHER -> Len(((<<1>> \o <<1, 2>>) \o [<<3, 1, 2>> EXCEPT ![1] = 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08484 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 59 to line 14, col 104 of module random_08484
---*)
