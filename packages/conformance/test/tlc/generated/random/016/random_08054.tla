(*---
description: Evaluates a random record expression, seed 262, number 8054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (0 \div -1), b |-> (<<>> \o <<3, 1, 2>>)] EXCEPT !.a = ((CHOOSE b12441 \in 1..3 : TRUE) % (--1))] EXCEPT !.a = @ + (Head(SelectSeq(<<>>, LAMBDA e : e > 0)) \div Len(Tail(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 28 to line 14, col 31 of module random_08054 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 26.
    | Expression starting at line 14, column 26.
    | ExtendableExpr starting at line 14, column 25.
    | Expression starting at line 14, column 25.
    | Field Value starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_08054
    | In module random_08054
    | Could not parse module random_08054 from file random_08054.tla
    | *** Errors: 1
    | In module random_08054
    | Could not parse module random_08054 from file random_08054.tla
    3002:1 Parsing or semantic analysis failed.
---*)
