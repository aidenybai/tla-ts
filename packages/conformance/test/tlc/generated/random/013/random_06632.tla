(*---
description: Evaluates a random bool expression, seed 262, number 6632.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06632 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ((2147483647 * 1) \div (1 \div -1))] = [[a |-> (-3), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])] EXCEPT !.a = @ + CASE (3 < -1) -> Head(<<1, 2>>) [] OTHER -> Len(<<1>>)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 92 to line 14, col 95 of module random_06632 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 90.
    | Expression starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 89.
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | Fatal errors while parsing TLA+ spec in file random_06632
    | In module random_06632
    | Could not parse module random_06632 from file random_06632.tla
    | *** Errors: 1
    | In module random_06632
    | Could not parse module random_06632 from file random_06632.tla
    3002:1 Parsing or semantic analysis failed.
---*)
