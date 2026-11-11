(*---
description: Evaluates a random seq expression, seed 262, number 4535.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04535 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Head([<<3, 1, 2>> EXCEPT ![1] = 7]), ((2 - 3) % ([x \in 1..2 |-> x])[0])>>, CASE ((FALSE <=> FALSE) <=> (TRUE <=> FALSE)) -> DOMAIN (2 :> 2147483647) [] OTHER -> (CHOOSE b7117 \in {b7118 \in Nat : TRUE} : (FALSE => TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04535 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
