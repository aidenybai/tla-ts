(*---
description: Evaluates a random seq expression, seed 262, number 1704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((SelectSeq(<<1>>, LAMBDA e : e > 0) \o <<-1, 1>>) \o Append(SortSeq(<<>>, LAMBDA p, q : p < q), Len(<<3, 1, 2>>))) EXCEPT ![1] = (\A b2718 \in {b2719 \in {-1, -1} : (FALSE => FALSE)} : (~(FALSE <=> FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<FALSE, -1, 1, 3>>"
---*)
