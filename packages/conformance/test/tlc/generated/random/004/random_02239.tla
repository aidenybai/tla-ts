(*---
description: Evaluates a random set expression, seed 262, number 2239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3520 \in {((-1 - 3) - CASE FALSE -> -1 [] OTHER -> 3), ([b3521 \in {1} |-> <<1, 2>>])[(-3)]} : (((b3520 < 3) => (b3520 < 2147483647)) <=> (SubSeq(<<3, 1, 2>>, 1, 1) = [(1 :> 2) EXCEPT ![<<1, 2>>] = b3520]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02239 failed.
    In applying the function
    <<<<1, 2>>>>,
    the first argument is:
    -3
    which is not in its domain.
---*)
