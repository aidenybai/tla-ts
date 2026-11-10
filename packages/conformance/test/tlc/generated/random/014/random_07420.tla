(*---
description: Evaluates a random seq expression, seed 262, number 7420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq((<<1, 2>> \o <<>>), LAMBDA e : e > 0) \o SubSeq(Append(<<1>>, 1), LET b11430 == 2 IN 0, (2147483647 \div 0))) \o SelectSeq((Append(<<1>>, 2) \o (<<1>> \o <<3, 1, 2>>)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07420 failed.
    2179:0 The second argument of \div is 0.
---*)
