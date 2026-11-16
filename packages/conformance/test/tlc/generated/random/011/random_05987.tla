(*---
description: Evaluates a random int expression, seed 262, number 5987.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05987 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b9227 \in (Append(<<1>>, 2) \ (1 .. 2)) : ((b9227 + 1) \in ({1} \cap {2, 1, 3}))) - Len(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05987 failed.
    Attempted to enumerate S \ T when S:
    <<1, 2>>
    is not enumerable.
---*)
