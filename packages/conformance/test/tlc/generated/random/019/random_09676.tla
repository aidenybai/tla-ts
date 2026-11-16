(*---
description: Evaluates a random int expression, seed 262, number 9676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((({} \cup {1}) \ {2, 7}) = DOMAIN [{} EXCEPT ![2] = 2]) THEN (-Cardinality(DOMAIN [x \in 1..2 |-> x])) ELSE Head(Tail(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09676 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
