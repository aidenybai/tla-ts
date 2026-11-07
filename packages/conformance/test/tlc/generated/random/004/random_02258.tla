(*---
description: Evaluates a random int expression, seed 262, number 2258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({b3558 \in {([a |-> 1, b |-> TRUE]).a : b3559 \in (<<5, 6>> \ 2..1)} : ((-b3558) \in (2..1 \ 2..1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02258 failed.
    Attempted to enumerate S \ T when S:
    <<5, 6>>
    is not enumerable.
---*)
