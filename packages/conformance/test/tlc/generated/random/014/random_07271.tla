(*---
description: Evaluates a random seq expression, seed 262, number 7271.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07271 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Append((<<>> \o <<3, 1, 2>>), (3 * 2147483647)), ((2 * 7) * Len(<<3, 1, 2>>))) \o <<(Head([a |-> 1, b |-> TRUE]) * Tail(<<>>)), Head((<<1>> \o <<>>))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3*2147483647
    2178:0 Overflow when computing 3*2147483647
---*)
