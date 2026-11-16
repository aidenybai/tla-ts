(*---
description: Evaluates a random function expression, seed 262, number 6875.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06875 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((-2) % ((1 :> 2))[b10538]) \div ((0 \div 2) * (b10538 - b10538))) : b10538 \in ((UNION {{x \in 1..3 : x > 1}, Nat} \cap (2147483647 .. -1)) \cup {CASE TRUE -> b10539 [] OTHER -> -1 : b10539 \in {b10540 \in Nat : TRUE}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06875 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
