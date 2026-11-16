(*---
description: Evaluates a random seq expression, seed 262, number 8227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((Head(<<1>>) % (7 - 7)) - SubSeq((<<3, 1, 2>> \o <<3, 1, 2>>), LET b12731 == FALSE IN b12731, (<<>> \o <<1, 2>>))), (CHOOSE b12732 \in {b12733 \in {b12734 \in SUBSET {1} : FALSE} : (\A b12735 \in 1..3 : TRUE)} : (([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ ([x \in 1..2 |-> x] \/ TRUE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08227 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
