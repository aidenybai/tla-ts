(*---
description: Evaluates a random bool expression, seed 262, number 6195.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06195 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b9542 \in (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]).a .. ((0 :> 7))[CASE FALSE -> 3 [] OTHER -> 2147483647]) : (~((<<1, 2>> \cup 2..1) \subseteq ({} \cup {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06195 failed.
    Attempted to apply function:
    (0 :> 7)
    to argument 2147483647, which is not in the domain of the function.
---*)
