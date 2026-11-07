(*---
description: Evaluates a random seq expression, seed 262, number 3661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Append(Append([<<3, 1, 2>> EXCEPT ![1] = 2], Head(<<>>)), ([<<5, 6>> EXCEPT ![0] = 0])[CASE TRUE -> 1 [] OTHER -> 0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
