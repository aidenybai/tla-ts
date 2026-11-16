(*---
description: Evaluates a random record expression, seed 262, number 3803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (((1 :> 2) @@ <<5, 6>>))[LET b5997 == {} IN b5997], b |-> ((<<5, 6>> @@ <<5, 6>>) \cap (2..1 \cap 3))] EXCEPT !.a = @ + (-(CASE TRUE -> 7 [] OTHER -> 2 + CASE FALSE -> 1 [] OTHER -> 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03803 failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
