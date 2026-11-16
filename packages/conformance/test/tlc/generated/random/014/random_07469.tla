(*---
description: Evaluates a random set expression, seed 262, number 7469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-(-1 \div 2)), CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> IF TRUE THEN 2147483647 ELSE 1 [] OTHER -> CASE TRUE -> 2 [] OTHER -> 7} \ (((0 % 1) \in DOMAIN <<5, 6>>) \/ (\E b11513 \in (Nat \cap TRUE) : ({x \in 1..3 : x > 1} = SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07469 failed.
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    TRUE
    is enumerable
---*)
