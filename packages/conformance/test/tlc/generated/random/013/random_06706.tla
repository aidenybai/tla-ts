(*---
description: Evaluates a random int expression, seed 262, number 6706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<([a |-> 1, b |-> TRUE]).a, [a |-> FALSE, b |-> TRUE]>>)[Head(<<-1, 3>>)] * LET b10276 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2..1]).a IN CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> [<<5, 6>> EXCEPT ![b10276] = 0] [] OTHER -> ([a |-> 1, b |-> TRUE]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06706 failed.
    Attempted to access index -1 of tuple
    <<1, [a |-> FALSE, b |-> TRUE]>>
    which is out of bounds.
---*)
