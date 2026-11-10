(*---
description: Evaluates a random function expression, seed 262, number 6451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9930 \in UNION {(UNION {[a |-> 1, b |-> TRUE], {2, 1, 3}} \cup {3 : b9931 \in <<1>>}), ((-0) .. ((1 :> 2))[2])} |-> (((b9930 \div <<1>>) + (0 * b9930)) - ((CHOOSE b9932 \in {1, 2} : FALSE) \div Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06451 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 96 to line 14, col 100 of module random_06451
---*)
