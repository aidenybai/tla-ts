(*---
description: Evaluates a random function expression, seed 262, number 323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b541 \in (LET b542 == Head(<<1>>) IN (-2147483647) .. ([b543 \in {x \in 1..3 : x > 1} |-> b543])[IF FALSE THEN 2 ELSE 1]) |-> (-({0, 0} \subseteq ({1} \cup {})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00323 failed.
    In applying the function
    (2 :> 2 @@ 3 :> 3),
    the first argument is:
    1
    which is not in its domain.
---*)
