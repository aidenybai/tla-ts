(*---
description: Evaluates a random function expression, seed 262, number 8061.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08061 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12452 \in {b12453 \in [b12454 \in UNION {{x \in 1..3 : x > 1}, {2, 1, 3}} |-> CASE TRUE -> 2 [] OTHER -> 2147483647] : (\E b12455 \in (Nat \cup 1..3) : (2..1 \subseteq {}))} |-> ((([a |-> 1, b |-> TRUE]).a \div (0 * 2)) + (SubSeq(<<1>>, b12452, 0)).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b12452 \\in {b12453 \\in <<2, 2, 2>> : <expression line 14, col 138 to line 14, col 188 of module random_08061> } |-> <expression line 14, col 197 to line 14, col 267 of module random_08061>]"
---*)
