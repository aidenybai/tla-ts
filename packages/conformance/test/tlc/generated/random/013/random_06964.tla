(*---
description: Evaluates a random seq expression, seed 262, number 6964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq((Append(<<1, 2>>, 2) \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), LAMBDA e : e > 0), ([[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + (-1 * -1)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 174 to line 14, col 174 of module random_06964 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 172.
    | Expression starting at line 14, column 171.
    | ExtendableExpr starting at line 14, column 170.
    | ExtendableExpr starting at line 14, column 166.
    | Expression starting at line 14, column 166.
    | Fatal errors while parsing TLA+ spec in file random_06964
    | In module random_06964
    | Could not parse module random_06964 from file random_06964.tla
    | *** Errors: 1
    | In module random_06964
    | Could not parse module random_06964 from file random_06964.tla
    3002:1 Parsing or semantic analysis failed.
---*)
