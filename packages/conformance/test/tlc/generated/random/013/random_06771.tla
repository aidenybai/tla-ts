(*---
description: Evaluates a random function expression, seed 262, number 6771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10382 \in (((Nat \cup {2, 1, 3}) \ (2..1 \cap {2, 1, 3})) \ CASE ({1, 2} = SUBSET {1}) -> (<<>>).a [] OTHER -> (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE)) |-> Len(Tail((<<1>> \o <<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06771 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
