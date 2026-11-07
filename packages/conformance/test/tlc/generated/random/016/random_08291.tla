(*---
description: Evaluates a random int expression, seed 262, number 8291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b12838 \in {7, 0} : (FALSE <=> <<>>)))[([<<5, 6>> EXCEPT ![(1 :> 2)] = -1])[(7 \div TRUE)]] \div CASE (\A b12839 \in (3 .. 1) : (\E b12840 \in {x \in 1..3 : x > 1} : FALSE)) -> Cardinality(UNION {{2, 1, 3}, Nat}) [] OTHER -> (Cardinality({x \in 1..3 : x > 1}) % (-2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08291 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 43 to line 14, col 56 of module random_08291
---*)
