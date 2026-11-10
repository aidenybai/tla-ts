(*---
description: Evaluates a random seq expression, seed 262, number 8431.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08431 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (FALSE <=> <<5, 6>>) -> Len(<<1, 2>>) [] OTHER -> (CHOOSE f \in [{1} -> {}] : TRUE) .. ([[a |-> 1] EXCEPT !.a = @ + -1] - (3 \div 1))) \cap [[a |-> (7 % 1), b |-> (<<3, 1, 2>> = [x \in Nat |-> x + 1])] EXCEPT !.a = @ + Len((<<1, 2>> \o <<1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08431 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 24 to line 14, col 41 of module random_08431
---*)
