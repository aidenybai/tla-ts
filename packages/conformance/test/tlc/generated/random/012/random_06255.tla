(*---
description: Evaluates a random set expression, seed 262, number 6255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((b9637 \div 3) :> ([x \in Nat |-> x + 1])[b9637]))[Len(Tail(<<3, 1, 2>>))] : b9637 \in {IF ({2, 1, 3} \subseteq Nat) THEN LET b9639 == b9638 IN b9638 ELSE CASE TRUE -> -1 [] OTHER -> b9638 : b9638 \in UNION {UNION {{2, 1, 3}, {2, 1, 3}}, {2147483647, 2}}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06255 failed.
    Attempted to apply function:
    (0 :> 2)
    to argument 2, which is not in the domain of the function.
---*)
