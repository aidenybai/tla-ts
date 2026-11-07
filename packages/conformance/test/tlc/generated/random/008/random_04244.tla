(*---
description: Evaluates a random function expression, seed 262, number 4244.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04244 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6676 \in ({b6677 \in {2147483647, 0} : (1..3 \subseteq {1, 2})} \ ({b6678 : b6678 \in {x \in 1..3 : x > 1}} \ Cardinality(1..3))) |-> Head(Append(SubSeq(<<3, 1, 2>>, 2147483647, 2), (CHOOSE b6679 \in {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04244 failed.
    Attempted to check if the value:
    2
    is an element of the integer 3
---*)
