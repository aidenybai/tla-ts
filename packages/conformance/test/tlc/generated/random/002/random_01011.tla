(*---
description: Evaluates a random record expression, seed 262, number 1011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(Len(<<1>>) :> (2147483647 + 3)) EXCEPT !.a = Cardinality(DOMAIN (1 :> 2))] EXCEPT !.a = Len(((<<1, 2>> \o <<>>) \o SubSeq(<<3, 1, 2>>, 2, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01011 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
