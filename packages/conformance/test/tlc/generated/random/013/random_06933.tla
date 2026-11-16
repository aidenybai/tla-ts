(*---
description: Evaluates a random function expression, seed 262, number 6933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10615 \in {[a |-> CASE FALSE -> 3 [] OTHER -> 1, b |-> (<<1>> = (1 :> 2))], (Head(<<3, 1, 2>>) - CASE FALSE -> 2 [] OTHER -> 3)} |-> (Cardinality((2..1 \ Nat)) % Len((2147483647 + 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06933 failed.
    Attempted to compare integer 0 with non-integer:
    [a |-> 1, b |-> FALSE]
---*)
