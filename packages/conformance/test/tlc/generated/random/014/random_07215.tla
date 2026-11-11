(*---
description: Evaluates a random seq expression, seed 262, number 7215.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07215 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(SubSeq((<<1>> \o <<>>), ([x \in 1..2 |-> x])[[x \in Nat |-> x + 1]], Cardinality({1, 2})), Cardinality({b11088 \in <<5, 6>> : TRUE}), CASE (TRUE /\ [a |-> 1, b |-> TRUE]) -> (3 \div -1) [] OTHER -> (7 \div 3)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 208 to line 14, col 211 of module random_07215 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 206.
    | Expression starting at line 14, column 206.
    | ExtendableExpr starting at line 14, column 205.
    | Expression starting at line 14, column 205.
    | Case Arm starting at line 14, column 170.
    | Fatal errors while parsing TLA+ spec in file random_07215
    | In module random_07215
    | Could not parse module random_07215 from file random_07215.tla
    | *** Errors: 1
    | In module random_07215
    | Could not parse module random_07215 from file random_07215.tla
    3002:1 Parsing or semantic analysis failed.
---*)
