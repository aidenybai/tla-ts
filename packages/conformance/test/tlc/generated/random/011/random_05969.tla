(*---
description: Evaluates a random int expression, seed 262, number 5969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((({1, 2} \ {x \in 1..3 : x > 1}) \cap <<0, 7>>) \subseteq (CASE TRUE -> 7 [] OTHER -> 0 .. (7 % 2147483647))) -> Len(Append((<<1>> \o <<>>), (3 * 2))) [] OTHER -> (CASE ({1, 2} = <<1>>) -> ({} \cup {x \in 1..3 : x > 1}) [] OTHER -> Head(<<>>) + Head(Append(<<>>, 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05969 failed.
    Attempted to check set membership in a tuple value.
---*)
