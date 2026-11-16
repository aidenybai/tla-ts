(*---
description: Evaluates a random bool expression, seed 262, number 6947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10630 \in ((Nat \ Nat) \ {0 : b10631 \in {x \in 1..3 : x > 1}}) : ((<<>> \o <<1, 2>>) = [[x \in 1..2 |-> x] EXCEPT ![b10630] = 0])) = UNION {{IF FALSE THEN 1 ELSE 0, LET b10632 == 1 IN b10632}, {b10633 \in CASE FALSE -> 1 [] OTHER -> 2147483647 : ([x \in Nat |-> x + 1] @@ <<5, 6>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06947 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
