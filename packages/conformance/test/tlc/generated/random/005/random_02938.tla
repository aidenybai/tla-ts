(*---
description: Evaluates a random function expression, seed 262, number 2938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4652 \in {b4653 \in ({b4654 \in [x \in 1..2 |-> x] : TRUE} \ {b4655 \in 1..3 : FALSE}) : (\A b4656 \in (Nat \cap {x \in 1..3 : x > 1}) : (TRUE <=> TRUE))} |-> Len(SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b4652 \\in {b4653 \\in {b4654 \\in <<1, 2>> : <expression line 14, col 71 to line 14, col 74 of module random_02938> } \\ {} : <expression line 14, col 108 to line 14, col 169 of module random_02938> } |-> <expression line 14, col 177 to line 14, col 245 of module random_02938>]"
---*)
