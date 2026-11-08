(*---
description: Evaluates a random bool expression, seed 262, number 4275.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04275 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((<<>> = <<5, 6>>) /\ (1 < 3)) -> ((TRUE \div 3) + (-3)) [] OTHER -> (Cardinality(1..3) = (1 \div 3)), b |-> (([a |-> 2147483647, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]) /\ Append(SelectSeq(<<1>>, LAMBDA e : e > 0), (0 :> [a |-> 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04275 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
