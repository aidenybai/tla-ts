(*---
description: Evaluates a random function expression, seed 262, number 5588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8654 \in UNION {((CHOOSE b8655 \in {x \in 1..3 : x > 1} : FALSE) .. (2147483647 % 0)), <<LET b8656 == 1 IN b8656, (CHOOSE b8657 \in {x \in 1..3 : x > 1} : FALSE)>>} |-> (-((-b8654) - (1 \div -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 204 to line 14, col 207 of module random_05588 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | ExtendableExpr starting at line 14, column 201.
    | ExtendableExpr starting at line 14, column 190.
    | Expression starting at line 14, column 190.
    | Fatal errors while parsing TLA+ spec in file random_05588
    | In module random_05588
    | Could not parse module random_05588 from file random_05588.tla
    | *** Errors: 1
    | In module random_05588
    | Could not parse module random_05588 from file random_05588.tla
    3002:1 Parsing or semantic analysis failed.
---*)
