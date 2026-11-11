(*---
description: Evaluates a random record expression, seed 262, number 4242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([a |-> (0 \div 1), b |-> (\A b6672 \in {1, 2} : FALSE)]).a, b |-> ((IF TRUE THEN -1 ELSE 0 .. (7 + 0)) = {b6673 \in {b6674 \in {x \in 1..3 : x > 1} : FALSE} : (b6673 \in {})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04242 failed.
    Attempted to check equality of integer -1 with non-integer:
    {}
---*)
