(*---
description: Evaluates a random seq expression, seed 262, number 2734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail((<<1, 2>> \o <<>>)) \o Tail(SelectSeq(<<>>, LAMBDA e : e > 0))) \o SelectSeq(Append((<<1, 2>> \o <<1>>), CASE FALSE -> 1 [] OTHER -> -1), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02734 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
