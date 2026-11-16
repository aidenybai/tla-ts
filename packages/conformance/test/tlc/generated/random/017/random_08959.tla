(*---
description: Evaluates a random record expression, seed 262, number 8959.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08959 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = (-1 \div -1)] EXCEPT !.a = CASE (~FALSE) -> (<<5, 6>>)[1] [] OTHER -> (3 % 0)] EXCEPT !.a = @ + (-Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 67 to line 14, col 70 of module random_08959 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 64.
    | ExtendableExpr starting at line 14, column 63.
    | Expression starting at line 14, column 63.
    | Except Spec starting at line 14, column 57.
    | Fatal errors while parsing TLA+ spec in file random_08959
    | In module random_08959
    | Could not parse module random_08959 from file random_08959.tla
    | *** Errors: 1
    | In module random_08959
    | Could not parse module random_08959 from file random_08959.tla
    3002:1 Parsing or semantic analysis failed.
---*)
