(*---
description: Evaluates a random function expression, seed 262, number 1563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Len(<<>>), b |-> (3 = 1)]).a :> LET b2498 == ((1 \div -1) * (-7)) IN [[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + CASE TRUE -> b2498 [] OTHER -> b2498]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 74 to line 14, col 77 of module random_01563 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 72.
    | Expression starting at line 14, column 72.
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | ExtendableExpr starting at line 14, column 70.
    | Fatal errors while parsing TLA+ spec in file random_01563
    | In module random_01563
    | Could not parse module random_01563 from file random_01563.tla
    | *** Errors: 1
    | In module random_01563
    | Could not parse module random_01563 from file random_01563.tla
    3002:1 Parsing or semantic analysis failed.
---*)
