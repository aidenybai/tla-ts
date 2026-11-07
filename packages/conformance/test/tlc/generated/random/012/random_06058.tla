(*---
description: Evaluates a random function expression, seed 262, number 6058.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06058 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(Head(<<1>>) :> (1 % -1)) EXCEPT ![CASE (FALSE \/ TRUE) -> (7 \div 3) [] OTHER -> (-1 \div 7)] = Head(Append({x \in 1..3 : x > 1}, 7))] EXCEPT ![((CHOOSE b9335 \in {b9336 \in <<1>> : [x \in 1..2 |-> x]} : (-1 \in {1})) % Len(Append(<<3, 1, 2>>, 3)))] = CASE (DOMAIN <<5, 6>> \subseteq (1 .. 2147483647)) -> CASE (\A b9337 \in 2..1 : b9337) -> (0 * 0) [] OTHER -> (2147483647 * 3) [] OTHER -> ([[a |-> 1] EXCEPT !.a = @ + -1]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
