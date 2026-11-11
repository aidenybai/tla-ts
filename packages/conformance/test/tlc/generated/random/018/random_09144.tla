(*---
description: Evaluates a random function expression, seed 262, number 9144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b14202 == (-7) IN ([a |-> 1, b |-> TRUE]).a :> Cardinality((2 .. -1))) EXCEPT ![(((3 * 2) * (<<5, 6>>)[-1]) + (Head(<<>>) * (7 % 0)))] = ([[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = IF TRUE THEN 2 ELSE -1]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09144 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
