(*---
description: Evaluates a random seq expression, seed 262, number 8430.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08430 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<((1 % 3) * LET b13051 == 3 IN 2), ([<<5, 6>> EXCEPT ![0] = <<1>>])[(1..3 \cap 1..3)]>> EXCEPT ![1] = (IF (~TRUE) THEN [a |-> 0, b |-> FALSE] ELSE (<<5, 6>>)[7] \div ((7 * 1) - (-1 \div -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 199 to line 14, col 202 of module random_08430 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 197.
    | Expression starting at line 14, column 196.
    | ExtendableExpr starting at line 14, column 195.
    | ExtendableExpr starting at line 14, column 185.
    | Expression starting at line 14, column 185.
    | Fatal errors while parsing TLA+ spec in file random_08430
    | In module random_08430
    | Could not parse module random_08430 from file random_08430.tla
    | *** Errors: 1
    | In module random_08430
    | Could not parse module random_08430 from file random_08430.tla
    3002:1 Parsing or semantic analysis failed.
---*)
