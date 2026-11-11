(*---
description: Evaluates a random record expression, seed 262, number 6701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SortSeq(<<3, 1>>, LAMBDA p, q : p < q)), b |-> ((SortSeq(<<1>>, LAMBDA p, q : p < q) \ {0, 2}) \subseteq (({} \cup {2, 1, 3}) \ DOMAIN [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06701 failed.
    Attempted to enumerate S \ T when S:
    <<1>>
    is not enumerable.
---*)
