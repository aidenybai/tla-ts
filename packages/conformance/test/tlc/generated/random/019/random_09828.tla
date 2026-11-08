(*---
description: Evaluates a random seq expression, seed 262, number 9828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq((<<-1, 2147483647>> \o (<<1, 2>> \o <<3, 1, 2>>)), LAMBDA p, q : p < q) EXCEPT ![1] = LET b15257 == ([b15258 \in {x \in 1..3 : x > 1} |-> b15258])[((1 :> 2))[-1]] IN (Len(<<1, 2>>) - (-2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09828 failed.
    2178:0 Overflow when computing 2--2147483647
---*)
