(*---
description: Evaluates a random function expression, seed 262, number 3563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b5630 \in (<<-1, 1>> \o (<<1, 2>> \o <<1>>)) |-> ((CHOOSE b5631 \in SUBSET {1} : FALSE) \div (b5630 \div b5630))] EXCEPT ![CASE (Cardinality(2..1) < Head(<<3, 1, 2>>)) -> IF (\E b5632 \in {1, 2} : TRUE) THEN [[a |-> 1] EXCEPT !.a = @ + 1] ELSE (-7) [] OTHER -> ((3 - 0) - (CHOOSE b5633 \in {1} : FALSE))] = ((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE))[IF (TRUE <=> TRUE) THEN ([a |-> 1]).a ELSE Head(<<1, 2>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03563 failed.
    Attempted to check set membership in a tuple value.
---*)
