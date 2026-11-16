(*---
description: Evaluates a random int expression, seed 262, number 4447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b6997 == (Cardinality({2147483647, 1}) * IF ([a |-> 1] = [a |-> 1]) THEN Cardinality(<<1>>) ELSE (-1 \div 0)) IN CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = <<1, 2>>] = [a |-> 2147483647, b |-> FALSE]) -> (CHOOSE b6998 \in (b6997 .. b6997) : (2147483647 = b6998)) [] OTHER -> ((2 % Nat) * IF FALSE THEN 2 ELSE <<1, 2>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04447 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    2147483647
---*)
