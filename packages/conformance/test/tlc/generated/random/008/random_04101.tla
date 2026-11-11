(*---
description: Evaluates a random seq expression, seed 262, number 4101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[<<(-3), (-1 \div 7)>> EXCEPT ![1] = Head(SelectSeq(<<>>, LAMBDA e : e > 0))] EXCEPT ![1] = (Len(Tail(<<1, 2>>)) * (CHOOSE b6443 \in (Nat \cap {}) : (2147483647 = 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04101 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
