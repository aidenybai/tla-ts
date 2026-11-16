(*---
description: Evaluates a random set expression, seed 262, number 3614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b5701 \in (<<1, 2>> \cup Nat) : (\E b5702 \in 2..1 : FALSE)), b |-> (~(<<1, 2>> = <<5, 6>>))] EXCEPT !.a = @ + (LET b5703 == ([x \in 1..2 |-> x] @@ (1 :> 2)) IN (b5703 * 1..3) - (-(3 \div 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03614 failed.
    Attempted to enumerate S \cup T when S:
    <<1, 2>>
    and T:
    Nat
    are not both enumerable
---*)
