(*---
description: Evaluates a random set expression, seed 262, number 1464.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01464 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2338 \in UNION {(DOMAIN [x \in 1..2 |-> x] \cap {b2339 \in {1, 2} : <<1>>}), {(1 * 1), (1 \div {2, 1, 3})}} : (DOMAIN ({2, 1, 3} \cap 1..3) \subseteq {IF FALSE THEN b2338 ELSE 2147483647, (2147483647 - b2338)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01464 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 86 to line 14, col 90 of module random_01464
---*)
