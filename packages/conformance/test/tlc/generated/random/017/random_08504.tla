(*---
description: Evaluates a random record expression, seed 262, number 8504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (2 - -1)] EXCEPT !.a = (((1 :> 2) @@ <<5, 6>>))[(2147483647 - 7)]] EXCEPT !.a = @ + (Len([b13173 \in {1} |-> b13173]) \div CASE (SUBSET {1} = [a |-> 1, b |-> TRUE]) -> (CHOOSE b13174 \in Nat : TRUE) [] OTHER -> Len(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08504 failed.
    Attempted to apply function:
    <<2, 6>>
    to argument 2147483640, which is not in the domain of the function.
---*)
