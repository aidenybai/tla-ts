(*---
description: Evaluates a random int expression, seed 262, number 6584.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06584 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (LET b10110 == Head(<<>>) IN ({1}).a = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a) -> LET b10111 == (CHOOSE b10112 \in (2 :> -1) : (<<>> = [x \in Nat |-> x + 1])) IN Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) [] OTHER -> ((CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06584 failed.
    Attempted to select field "a" from a non-record value {1}
    line 14, col 50 to line 14, col 56 of module random_06584
---*)
