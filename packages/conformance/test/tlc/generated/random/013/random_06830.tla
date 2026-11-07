(*---
description: Evaluates a random seq expression, seed 262, number 6830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([Tail((<<>> \o <<>>)) EXCEPT ![1] = ([a |-> 1, b |-> TRUE]).a], (Len([<<1, 2>> EXCEPT ![1] = 7]) + (-LET b10467 == -1 IN -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
