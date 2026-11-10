(*---
description: Evaluates a random seq expression, seed 262, number 8534.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08534 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), LAMBDA e : e > 0) EXCEPT ![1] = ((CHOOSE b13226 \in (0 .. 1) : {b13227 : b13227 \in FALSE}) % Len(SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08534 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 156 to line 14, col 160 of module random_08534
---*)
