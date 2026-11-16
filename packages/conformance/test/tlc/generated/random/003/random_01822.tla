(*---
description: Evaluates a random bool expression, seed 262, number 1822.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01822 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b2890 \in ((CASE TRUE -> 2 [] OTHER -> 2147483647 .. (2147483647 + 2147483647)) \ (DOMAIN <<5, 6>> \cup (2..1 \cap {2, 1, 3}))) : (CASE (<<1, 2>> = [a |-> 1, b |-> TRUE]) -> (b2890 \div <<1, 2>>) [] OTHER -> Head(<<>>) = CASE (b2890 < b2890) -> (-2) [] OTHER -> (3 % 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01822 failed.
    Attempted to enumerate S \ T when S:
    2
    is not enumerable.
---*)
