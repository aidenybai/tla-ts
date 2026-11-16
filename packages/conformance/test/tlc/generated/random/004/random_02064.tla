(*---
description: Evaluates a random set expression, seed 262, number 2064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((b3285 .. b3285) = {b3285 : b3286 \in SUBSET {1}}) -> Head(Append(<<1>>, b3285)) [] OTHER -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]).a : b3285 \in (({-1, 2147483647} = (1..3 \ {1, 2})) => (~(<<1>> = (1 :> 2))))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02064 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 172 to line 14, col 232 of module random_02064
---*)
