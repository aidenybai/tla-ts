(*---
description: Evaluates a random set expression, seed 262, number 4517.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04517 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7099 \in ({b7100 \in {2, 3} : (b7100 = 1..3)} \ UNION {(0 .. 1), {-1, 7}}) : (Tail(SelectSeq(<<>>, LAMBDA e : e > 0)) = (Head(<<>>) :> ([a |-> 1, b |-> TRUE]).a))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04517 failed.
    Attempted to check equality of integer 2 with non-integer:
    1..3
---*)
