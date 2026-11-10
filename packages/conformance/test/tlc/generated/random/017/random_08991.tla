(*---
description: Evaluates a random seq expression, seed 262, number 8991.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08991 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(((1 :> 2) @@ [x \in 1..2 |-> x]))[LET b13964 == 3 IN 3], (-Head(<<1, 2>>))>>, (-[b13965 \in ({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1}) |-> (-b13965)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08991 failed.
    Attempted to apply function:
    <<2, 2>>
    to argument 3, which is not in the domain of the function.
---*)
