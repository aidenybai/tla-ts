(*---
description: Evaluates a random function expression, seed 262, number 299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE b496 \in SUBSET {1} : b496) \div Cardinality({2, 1, 3})) :> LET b497 == (7 .. 1) IN Len(<<>>)) EXCEPT ![(Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) % Head((<<>> \o <<1>>)))] = ([a |-> (7 + 2), b |-> (<<1, 2>> \in 1..3)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00299 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 20 to line 14, col 52 of module random_00299
---*)
