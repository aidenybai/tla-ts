(*---
description: Evaluates a random function expression, seed 262, number 9047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(<<3, 3>>) \div Len((<<1>> \o <<1>>))) :> (((-1 :> 3))[Len(<<3, 1, 2>>)] % Append((<<>> \o TRUE), (-1 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09047 failed.
    Attempted to apply function:
    (-1 :> 3)
    to argument 3, which is not in the domain of the function.
---*)
