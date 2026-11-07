(*---
description: Evaluates a random record expression, seed 262, number 1058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((7 :> 2))[(1 % 7)], b |-> (\A b1694 \in UNION {Nat, SUBSET {1}} : ({} = {}))] EXCEPT !.a = (((2147483647 * 7) - Head(<<1, 2>>)) + UNION {{[a |-> 1] : b1695 \in {x \in 1..3 : x > 1}}, (1..3 \cup {x \in 1..3 : x > 1})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01058 failed.
    Attempted to apply function:
    (7 :> 2)
    to argument 1, which is not in the domain of the function.
---*)
