(*---
description: Evaluates a random int expression, seed 262, number 6011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b9255 == IF (~TRUE) THEN (0 \div -1) ELSE (1 .. <<>>) IN Len(Tail(<<1>>)) \div (Head([<<>> EXCEPT ![1] = 2147483647]) + (CHOOSE b9256 \in {2, 2147483647} : (~TRUE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 49 to line 14, col 52 of module random_06011 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 47.
    | Expression starting at line 14, column 47.
    | ExtendableExpr starting at line 14, column 46.
    | Expression starting at line 14, column 46.
    | IF THEN ELSE starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_06011
    | In module random_06011
    | Could not parse module random_06011 from file random_06011.tla
    | *** Errors: 1
    | In module random_06011
    | Could not parse module random_06011 from file random_06011.tla
    3002:1 Parsing or semantic analysis failed.
---*)
