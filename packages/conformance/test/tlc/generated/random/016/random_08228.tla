(*---
description: Evaluates a random record expression, seed 262, number 8228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> ([x \in 1..2 |-> x])[2147483647], b |-> (FALSE <=> FALSE)] EXCEPT !.a = ([a |-> 1, b |-> FALSE]).a] EXCEPT !.a = CASE ((~TRUE) => (2147483647 \in {1, 2})) -> CASE ({2, 1, 3} = Nat) -> CASE TRUE -> -1 [] OTHER -> 2 [] OTHER -> (CHOOSE r \in [a : 2..1] : TRUE) [] OTHER -> (-<<2, -1>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08228 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
