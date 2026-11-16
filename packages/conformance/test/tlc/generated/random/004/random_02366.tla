(*---
description: Evaluates a random function expression, seed 262, number 2366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(-0)) % ([<<5, 6>> EXCEPT ![2] = 7])[CASE TRUE -> 7 [] OTHER -> 7]) < Len(SubSeq((<<1, 2>> \o <<3, 1, 2>>), (1 + 1), (-0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02366 failed.
    Attempted to access index 7 of tuple
    <<5, 7>>
    which is out of bounds.
---*)
