(*---
description: Evaluates a random record expression, seed 262, number 8618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> {-1, 2}, b |-> (\E b13347 \in {} : TRUE)] EXCEPT !.a = CASE (TRUE => <<5, 6>>) -> Tail(<<3, 1, 2>>) [] OTHER -> (CHOOSE b13348 \in {2, 1, 3} : FALSE)] EXCEPT !.a = @ + (IF (SUBSET {1} = Nat) THEN CASE TRUE -> 2147483647 [] OTHER -> 0 ELSE Tail(<<3, 1, 2>>) % ([(1 :> 2) EXCEPT ![2147483647] = 0])[([x \in 1..2 |-> x] @@ <<5, 6>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08618 failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a tuple.
    line 14, col 86 to line 14, col 101 of module random_08618
---*)
