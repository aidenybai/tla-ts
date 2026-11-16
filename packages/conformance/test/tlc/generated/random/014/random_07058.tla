(*---
description: Evaluates a random set expression, seed 262, number 7058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(({b10835, 3} + {b10835, 1}) \div CASE (7 \in <<1>>) -> IF FALSE THEN 0 ELSE 2 [] OTHER -> LET b10836 == b10835 IN 0) : b10835 \in {b10837 \in {([a |-> 1]).a : b10838 \in UNION {1..3, Nat}} : ({0, b10837} \subseteq UNION {{1}, {x \in 1..3 : x > 1}})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07058 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    1..3
---*)
