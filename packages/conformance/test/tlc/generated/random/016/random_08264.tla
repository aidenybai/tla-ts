(*---
description: Evaluates a random function expression, seed 262, number 8264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Append(<<1, 2>>, 0)) - ((7 :> 0))[Cardinality({1, 2})]) :> (Len((<<>> \o <<>>)) + (IF TRUE THEN 1 ELSE FALSE \div CASE FALSE -> 0 [] OTHER -> 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08264 failed.
    Attempted to apply function:
    (7 :> 0)
    to argument 2, which is not in the domain of the function.
---*)
