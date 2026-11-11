(*---
description: Evaluates a random bool expression, seed 262, number 2634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<5, 6>> @@ <<5, 6>>))[Len(<<3, 1, 2>>)] \div ([a |-> -1, b |-> FALSE]).a) \in ((CASE FALSE -> 3 [] OTHER -> 2 .. CASE FALSE -> 2147483647 [] OTHER -> 2) \cap ({2, 1} \ ({2, 1, 3} \cup 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02634 failed.
    Attempted to apply function:
    <<5, 6>>
    to argument 3, which is not in the domain of the function.
---*)
