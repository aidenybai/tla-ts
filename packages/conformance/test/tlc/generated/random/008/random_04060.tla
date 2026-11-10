(*---
description: Evaluates a random function expression, seed 262, number 4060.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04060 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6391 \in {DOMAIN (FALSE @@ <<5, 6>>) : b6392 \in (({1} \cap {}) \cup (-3))} |-> Len(Append(Tail(<<>>), Head(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04060 failed.
    TLC encountered a non-enumerable quantifier bound
    -3.
    line 14, col 68 to line 14, col 90 of module random_04060
---*)
