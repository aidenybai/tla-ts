(*---
description: Evaluates a random set expression, seed 262, number 3051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o (<<3, 1, 2>> \o <<3, 1, 2>>))), LET b4849 == (CHOOSE b4850 \in {b4851 : b4851 \in {2, 1, 3}} : [[a |-> 1] EXCEPT !.a = 7]) IN (([a |-> 1]).a % (b4849 * -1))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 215 to line 14, col 215 of module random_03051 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 209.
    | Expression starting at line 14, column 209.
    | ExtendableExpr starting at line 14, column 208.
    | ExtendableExpr starting at line 14, column 192.
    | Expression starting at line 14, column 192.
    | Fatal errors while parsing TLA+ spec in file random_03051
    | In module random_03051
    | Could not parse module random_03051 from file random_03051.tla
    | *** Errors: 1
    | In module random_03051
    | Could not parse module random_03051 from file random_03051.tla
    3002:1 Parsing or semantic analysis failed.
---*)
