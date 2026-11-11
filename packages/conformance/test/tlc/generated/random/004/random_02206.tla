(*---
description: Evaluates a random seq expression, seed 262, number 2206.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02206 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((2 - 0) + (2 * 3)), ([b3467 \in {x \in 1..3 : x > 1} |-> b3467])[([a |-> 1, b |-> TRUE]).a]>> \o <<(LET b3468 == 0 IN 2147483647 % CASE FALSE -> -1 [] OTHER -> 0), ([b3469 \in 1..3 |-> b3469])[(0 - 2)]>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02206 failed.
    In applying the function
    (2 :> 2 @@ 3 :> 3),
    the first argument is:
    1
    which is not in its domain.
---*)
