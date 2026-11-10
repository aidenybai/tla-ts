(*---
description: Evaluates a random seq expression, seed 262, number 127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SortSeq(<<2, 0>>, LAMBDA p, q : p < q) EXCEPT ![1] = (DOMAIN [x \in 1..2 |-> x] * (CHOOSE b198 \in {1} : FALSE))], ([a |-> ([a |-> 1, b |-> TRUE]).a, b |-> [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]]).a, (-Head((<<1>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 78 to line 14, col 83 of module random_00127 and *.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 85.
    | Expression starting at line 14, column 78.
    | ExtendableExpr starting at line 14, column 77.
    | Expression starting at line 14, column 77.
    | Except Spec starting at line 14, column 70.
    | Fatal errors while parsing TLA+ spec in file random_00127
    | In module random_00127
    | Could not parse module random_00127 from file random_00127.tla
    | *** Errors: 1
    | In module random_00127
    | Could not parse module random_00127 from file random_00127.tla
    3002:1 Parsing or semantic analysis failed.
---*)
