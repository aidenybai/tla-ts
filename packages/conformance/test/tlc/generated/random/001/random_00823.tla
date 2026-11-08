(*---
description: Evaluates a random function expression, seed 262, number 823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq((<<3, 1, 2>> \o <<3, 1, 2>>), LAMBDA e : e > 0), Cardinality({b1347 : b1347 \in {1}})) EXCEPT ![(Head(SelectSeq(<<>>, LAMBDA e : e > 0)) * Len([<<1>> EXCEPT ![1] = 1]))] = Len(Append(Append(<<1>>, 2), (7 % 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00823 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
