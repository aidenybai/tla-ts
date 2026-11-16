(*---
description: Evaluates a random set expression, seed 262, number 3311.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03311 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE b5260 \in {-1, [a |-> 1, b |-> TRUE]} : (b5260 < <<>>)) - (CHOOSE b5261 \in (Nat \ 2..1) : (b5261 = 7))), Head(SelectSeq([<<1>> EXCEPT ![1] = 7], LAMBDA e : e > 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03311 failed.
    Attempted to compare record:
    [a |-> 1, b |-> TRUE]
    with non-record
    -1
---*)
