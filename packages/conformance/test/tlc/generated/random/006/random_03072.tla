(*---
description: Evaluates a random int expression, seed 262, number 3072.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03072 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4872 == CASE ([a |-> 1, b |-> TRUE] = FALSE) -> CASE FALSE -> 2147483647 [] OTHER -> 2147483647 [] OTHER -> CASE FALSE -> 1 [] OTHER -> 2 IN (((1 :> 2) @@ <<5, 6>>))[LET b4873 == b4872 IN 2147483647] - (LET b4874 == ({1} \subseteq {1, 2}) IN [[a |-> 1] EXCEPT !.a = @ + b4874] % ((3 - 1) + CASE TRUE -> 3 [] OTHER -> 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03072 failed.
    Attempted to apply function:
    <<2, 6>>
    to argument 2147483647, which is not in the domain of the function.
---*)
