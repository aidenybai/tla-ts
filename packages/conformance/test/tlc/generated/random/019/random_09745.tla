(*---
description: Evaluates a random seq expression, seed 262, number 9745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(Tail(Tail(<<1, 2>>)), LAMBDA p, q : p < q), Len(SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0)), IF ((0 \div -1) \in (7 .. 3)) THEN ((CHOOSE r \in [a : {1}] : TRUE)).a ELSE ((0 + 2147483647) + {b15132 \in 1..3 : <<1>>})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 155 to line 14, col 158 of module random_09745 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 153.
    | Expression starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 152.
    | ExtendableExpr starting at line 14, column 151.
    | Fatal errors while parsing TLA+ spec in file random_09745
    | In module random_09745
    | Could not parse module random_09745 from file random_09745.tla
    | *** Errors: 1
    | In module random_09745
    | Could not parse module random_09745 from file random_09745.tla
    3002:1 Parsing or semantic analysis failed.
---*)
