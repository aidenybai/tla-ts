(*---
description: Evaluates a random record expression, seed 262, number 646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((TRUE => TRUE) => (FALSE /\ TRUE)) -> ((3 :> 1))[LET b1078 == 0 IN -1] [] OTHER -> Len(Tail(<<>>)), b |-> (~(Cardinality(Nat) = Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00646 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
