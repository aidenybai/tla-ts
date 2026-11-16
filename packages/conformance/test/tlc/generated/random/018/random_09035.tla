(*---
description: Evaluates a random seq expression, seed 262, number 9035.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((([a |-> 1]).a \div (2147483647 \div -1)) * IF (TRUE => TRUE) THEN (-1 \div 0) ELSE IF [a |-> 1, b |-> TRUE] THEN <<1>> ELSE 1), [[[a |-> 2, b |-> TRUE] EXCEPT !.a = @ + DOMAIN [x \in 1..2 |-> x]] EXCEPT !.a = ([a |-> 0, b |-> FALSE]).a]>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 51 to line 14, col 54 of module random_09035 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 40.
    | Expression starting at line 14, column 40.
    | ExtendableExpr starting at line 14, column 39.
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | Fatal errors while parsing TLA+ spec in file random_09035
    | In module random_09035
    | Could not parse module random_09035 from file random_09035.tla
    | *** Errors: 1
    | In module random_09035
    | Could not parse module random_09035 from file random_09035.tla
    3002:1 Parsing or semantic analysis failed.
---*)
