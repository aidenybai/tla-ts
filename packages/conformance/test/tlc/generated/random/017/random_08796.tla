(*---
description: Evaluates a random seq expression, seed 262, number 8796.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08796 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((Append(<<1, 1>>, ([a |-> 1, b |-> TRUE]).a) \o <<CASE FALSE -> 2147483647 [] OTHER -> 1, ({1, 2} \ 2..1)>>), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08796 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    {1, 2}
---*)
